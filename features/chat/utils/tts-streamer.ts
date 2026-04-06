/**
 * Text Chunker configured for Edge TTS optimal streaming.
 * Handles priority-based splitting, length constraints, and edge cases.
 */
export class TTSChunker {
  private buffer: string = '';
  private readonly minChunk: number = 20;
  private readonly maxChunk: number = 150;
  
  // Common prefixes that should never trigger a sentence split
  private readonly abbreviations: Set<string> = new Set([
    'mr', 'mrs', 'ms', 'dr', 'prof', 'sr', 'jr', 'vs', 'etc', 'ie', 'eg'
  ]);

  /**
   * Processes incoming text stream tokens and returns an array of ready chunks.
   */
  public processChunk(text: string): string[] {
    this.buffer += text;
    const chunks: string[] = [];

    // Continuously pull off perfect chunks from the front of the buffer
    while (this.buffer.length > 0) {
      const splitIdx = this.findSplitPoint(false);
      
      if (splitIdx === -1) break; // Hold: we need more tokens to fulfill boundaries

      const chunk = this.buffer.slice(0, splitIdx).trim();
      this.buffer = this.buffer.slice(splitIdx).trimStart(); // Move buffer forward
      
      if (chunk.length > 0) chunks.push(chunk);
    }

    return chunks;
  }

  /**
   * Final forced-grab when the LLM stream is finished
   */
  public flush(): string[] {
    const chunks: string[] = [];
    while (this.buffer.trim().length > 0) {
      const splitIdx = this.findSplitPoint(true);
      if (splitIdx === -1) {
        const chunk = this.buffer.trim();
        if (chunk.length > 0) chunks.push(chunk);
        this.buffer = '';
        break;
      }
      
      const chunk = this.buffer.slice(0, splitIdx).trim();
      this.buffer = this.buffer.slice(splitIdx).trimStart();
      if (chunk.length > 0) chunks.push(chunk);
    }
    return chunks;
  }

  /**
   * Explores the buffer to find the best immediate slice boundary
   */
  private findSplitPoint(isFlush: boolean): number {
    if (this.buffer.length === 0) return -1;

    // Overwrite safeguard: If streaming finished and text is tiny, just pull it all
    if (isFlush && this.buffer.length <= this.maxChunk) {
      return this.buffer.length;
    }

    let bestPrio1 = -1; // . ! ? …
    let bestPrio2 = -1; // ; :
    let bestPrio3 = -1; // ,
    let bestPrio4 = -1; // whitespace (fallback)

    const scanLimit = Math.min(this.buffer.length, this.maxChunk);

    for (let i = 0; i < scanLimit; i++) {
        const char = this.buffer[i];
        const hasNextChar = i + 1 < this.buffer.length;
        
        // Wait safeguard: if we are mid-stream and standing on the absolute last character,
        // we pause because we don't know what char comes next (might be quotes, decimals, etc.)
        if (!hasNextChar && !isFlush && this.buffer.length < this.maxChunk) continue;

        const peekChar = hasNextChar ? this.buffer[i + 1] : " ";

        // Priority 1: Sentence Boundaries
        if (['.', '!', '?', '…'].includes(char)) {
            if (this.isValidSentenceEnd(i)) {
                let splitIdx = i + 1;
                
                // Include terminal quotes inside this sentence! 
                while (splitIdx < this.buffer.length && ['"', "'", '”', '’', ')', ']'].includes(this.buffer[splitIdx])) {
                    splitIdx++;
                }

                if (splitIdx >= this.minChunk) bestPrio1 = splitIdx;
            }
        } 
        // Priority 2: Clause separators
        else if ([';', ':'].includes(char)) {
            if (!hasNextChar || peekChar === ' ' || peekChar === '\n') {
                if (i + 1 >= this.minChunk) bestPrio2 = i + 1;
            }
        } 
        // Priority 3: Commas
        else if (char === ',') {
            if (!hasNextChar || peekChar === ' ' || peekChar === '\n') {
                if (i + 1 >= this.minChunk) bestPrio3 = i + 1;
            }
        } 
        // Priority 4: Whitespace
        else if (char === ' ' || char === '\n') {
            if (i >= this.minChunk) bestPrio4 = i;
        }
    }

    // Default Streaming logic
    if (this.buffer.length < this.maxChunk && !isFlush) {
        if (bestPrio1 !== -1) return bestPrio1; // Only yield boundaries early that are strong sentences
        return -1; // Wait for more texts
    }

    // Max threshold exceeded - force slice logic using highest priority available
    if (bestPrio1 !== -1) return bestPrio1;
    if (bestPrio2 !== -1) return bestPrio2;
    if (bestPrio3 !== -1) return bestPrio3;
    if (bestPrio4 !== -1) return bestPrio4;

    // Hard fallback: Try to carve at ANY whitespace, violating minChunk limitations if absolutely necessary.
    const lastSpaceFallback = this.buffer.lastIndexOf(' ', this.maxChunk - 1);
    if (lastSpaceFallback > 0) return lastSpaceFallback;

    return this.maxChunk; // Deep recursion fallback for solid text bodies (rare)
  }

  /**
   * Safely scans punctuation checks. 
   */
  private isValidSentenceEnd(index: number): boolean {
    const char = this.buffer[index];

    let peekIdx = index + 1;
    
    // Look ahead past wrapping quotes...
    while (peekIdx < this.buffer.length) {
        const p = this.buffer[peekIdx];
        if (['"', "'", '”', '’', ')', ']'].includes(p)) peekIdx++;
        else if (['.', '!', '?', '…'].includes(p)) {
            // Found consecutive punctuation (e.g. '?!' or '...'). Let the *final* one handle the slicing to keep them grouped!
            return false; 
        } else {
            break;
        }
    }

    const hasCharAfter = peekIdx < this.buffer.length;
    const charAfter = hasCharAfter ? this.buffer[peekIdx] : " ";

    // Real sentence ends must have a space backing them up
    if (charAfter !== ' ' && charAfter !== '\n') return false;

    if (char === '.') {
        // Scrape backwards to verify we aren't splitting an abbreviation
        let start = index - 1;
        while (start >= 0 && /[a-zA-Z]/.test(this.buffer[start])) {
            start--;
        }
        
        const word = this.buffer.slice(start + 1, index).toLowerCase();
        if (this.abbreviations.has(word)) return false;

        // Multi-dot abbreviations (e.g., i.e., e.g., a.m., p.m.)
        const threeCharSearch = this.buffer.slice(Math.max(0, index - 3), index).toLowerCase();
        if (['i.e', 'e.g', 'a.m', 'p.m'].includes(threeCharSearch)) return false;
    }

    return true;
  }
}

/**
 * Streaming TTS Pipeline using Web Audio API queue
 */
export class TTSStreamer {
  private chunker = new TTSChunker();
  
  // A queue of promises allowing parallel generation but strict sequential playback
  private synthesisQueue: Promise<string>[] = [];
  private isPlaying = false;
  private abortController: AbortController | null = null;
  
  constructor(
    private options?: {
      playbackRate?: number;
      onSpeakingStateChange?: (isSpeaking: boolean) => void;
    }
  ) {}

  /**
   * Feed raw LLM text tokens as they arrive.
   */
  public appendTextTokens(text: string) {
    const readyChunks = this.chunker.processChunk(text);
    this.scheduleChunks(readyChunks);
  }

  /**
   * Call when stream completely finishes.
   */
  public finish() {
    const remainingChunks = this.chunker.flush();
    this.scheduleChunks(remainingChunks);
  }

  private scheduleChunks(chunks: string[]) {
    for (const chunk of chunks) {
      // Begin synthesizing the chunk IMMEDIATELY (parallel network requests)
      // This promise resolves to an audio blob URL once the Edge TTS API finishes
      const audioPromise = this.synthesizeToEdgeTTS(chunk);
      this.synthesisQueue.push(audioPromise);
      
      // Attempt to kick off the playback loop if asleep
      this.playNextInQueue(); 
    }
  }

  private async playNextInQueue() {
    if (this.isPlaying || this.synthesisQueue.length === 0) {
      if (!this.isPlaying && this.synthesisQueue.length === 0) {
        this.options?.onSpeakingStateChange?.(false);
      }
      return;
    }
    
    this.isPlaying = true;
    this.options?.onSpeakingStateChange?.(true);

    // Grab the NEXT promise in the sequence
    const audioPromise = this.synthesisQueue.shift()!;

    try {
      // 1. Wait for this specific chunk's audio to finish loading over network
      const audioUrl = await audioPromise; 
      
      // 2. Play the audio synchronously
      await this.playAudio(audioUrl);

      // Clean up object memory
      URL.revokeObjectURL(audioUrl); 
    } catch (error) {
      console.error("TTS generation or playback failed:", error);
    } finally {
      this.isPlaying = false;
      // 3. Recursive call to play the next one after the current one completes
      this.playNextInQueue();
    }
  }

  /**
   * Handles Edge TTS integration (Implement with your actual Edge TTS API Wrapper)
   */
  private async synthesizeToEdgeTTS(text: string): Promise<string> {
    const cleanText = text
      // 1. Giữ lại text hiển thị của markdown link, xoá phần URL: [Tên Link](https://...) -> Tên Link
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      // 2. Xoá toàn bộ các raw URL (http://, https://)
      .replace(/https?:\/\/[^\s]+/g, "")
      // 3. Xoá các ký tự markdown định dạng (*, #)
      .replace(/[*#]/g, "")
      .trim();
      
    if (!cleanText) return "";

    const playbackRate = this.options?.playbackRate ?? 1.2;
    const rateParam =
      playbackRate !== 1
        ? `${playbackRate > 1 ? "+" : ""}${Math.round((playbackRate - 1) * 100)}%`
        : undefined;

    const response = await fetch('/api/tts', { 
      method: 'POST', 
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: cleanText, rate: rateParam }) 
    });

    if (!response.ok) {
      throw new Error(`TTS API error: ${response.statusText}`);
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  }

  /**
   * Wraps HTML5 Audio element inside a Promise to monitor end events
   */
  private playAudio(url: string): Promise<void> {
    if (!url) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const audio = new Audio(url);
      
      this.abortController = new AbortController();
      this.abortController.signal.addEventListener("abort", () => {
        audio.pause();
        audio.currentTime = 0;
        resolve(); // resolve so queue continues (and skips if cleared)
      });

      audio.onended = () => resolve();
      audio.onerror = (e) => reject(e);
      
      audio.play().catch((err) => {
        if (err.name !== "AbortError") {
          reject(err);
        } else {
          resolve();
        }
      }); 
    });
  }

  public stop() {
    this.synthesisQueue = []; // clear remaining
    if (this.abortController) {
      this.abortController.abort();
    }
    this.isPlaying = false;
    this.options?.onSpeakingStateChange?.(false);
  }
}
