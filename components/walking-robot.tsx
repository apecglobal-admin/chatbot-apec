"use client";

import React, { useEffect, useRef } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

interface WalkingRobotProps {
  /**
   * Đường dẫn tới file Lottie JSON
   * @default "/Robot-Bot 3D.json"
   */
  src?: string;
  /**
   * Kích thước của robot (pixel)
   * @default 150
   */
  size?: number;
  /**
   * Tốc độ di chuyển (pixel per frame)
   * @default 2
   */
  speed?: number;
}

export function WalkingRobot({
  src = "/Robot-Bot 3D.json",
  size = 150,
  speed = 2,
}: WalkingRobotProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef({ x: 0, direction: 1 });

  useEffect(() => {
    let animationFrameId: number;
    // Khởi tạo vị trí x ngẫu nhiên lúc ban đầu
    positionRef.current.x =
      Math.random() * (window.innerWidth - size);

    const animate = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const screenWidth = window.innerWidth;

        let { x, direction } = positionRef.current;

        // Cập nhật vị trí
        x += speed * direction;

        // Xử lý chạm viền màn hình (đảo chiều)
        if (x <= 0) {
          x = 0;
          direction = 1;
        } else if (x + containerWidth >= screenWidth) {
          x = screenWidth - containerWidth;
          direction = -1;
        }

        positionRef.current = { x, direction };

        // Dùng translate3d để tăng tốc phần cứng, scaleX để đảo chiều ngang
        // Giả sử Lottie robot mặc định quay mặt sang phải
        containerRef.current.style.transform = `translate3d(${x}px, 0, 0) scaleX(${direction})`;
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrameId);
  }, [speed, size]);

  return (
    <div
      ref={containerRef}
      className="fixed bottom-0 z-40 pointer-events-none will-change-transform"
      style={{
        width: size,
        height: size,
        // Đảm bảo phần tử không bị highlight và ngăn việc kéo thả
        userSelect: "none",
      }}
    >
      <DotLottieReact
        src={src}
        loop
        autoplay
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}

