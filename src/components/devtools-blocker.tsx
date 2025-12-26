"use client";

import { useEffect } from "react";

export function DevToolsBlocker() {
  useEffect(() => {
    // Chặn các phím tắt mở DevTools
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.key === "F12") {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+Shift+I (Windows/Linux) hoặc Cmd+Option+I (Mac)
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        (e.key === "I" || e.key === "i")
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+Shift+J (Windows/Linux) hoặc Cmd+Option+J (Mac)
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        (e.key === "J" || e.key === "j")
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+Shift+C (Windows/Linux) hoặc Cmd+Option+C (Mac)
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        (e.key === "C" || e.key === "c")
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+U (View Source)
      if ((e.ctrlKey || e.metaKey) && (e.key === "U" || e.key === "u")) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+Shift+K (Firefox)
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        (e.key === "K" || e.key === "k")
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // Phát hiện khi DevTools được mở bằng cách kiểm tra kích thước window
    let devtools = {
      open: false,
      orientation: null as "vertical" | "horizontal" | null,
    };

    const detectDevTools = () => {
      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;

      if (
        !(widthThreshold && heightThreshold) &&
        (widthThreshold || heightThreshold)
      ) {
        if (!devtools.open) {
          devtools.open = true;
          devtools.orientation = widthThreshold ? "vertical" : "horizontal";
          handleDevToolsOpen();
        }
      } else {
        if (devtools.open) {
          devtools.open = false;
          devtools.orientation = null;
        }
      }
    };

    // Phát hiện bằng console
    const detectConsole = () => {
      const element = new Image();
      Object.defineProperty(element, "id", {
        get: function () {
          handleDevToolsOpen();
        },
      });
      // console.log(element);
      // console.clear();
    };

    // Hàm xử lý khi phát hiện DevTools mở
    const handleDevToolsOpen = () => {
      // Tùy chọn 1: Redirect về trang chủ
      // window.location.href = "/";

      // Tùy chọn 2: Reload trang
      // window.location.reload();

      // Tùy chọn 3: Hiển thị cảnh báo và đóng DevTools (nếu có thể)
      // console.clear();
      // console.log("%c⚠️ CẢNH BÁO ⚠️", "color: red; font-size: 50px; font-weight: bold;");
      // console.log(
      //   "%cBạn không được phép mở Developer Tools!",
      //   "color: red; font-size: 20px;"
      // );

      // Tùy chọn 4: Chỉ log (không làm gì)
      // Có thể thêm logic khác ở đây
    };

    // Chặn context menu (click chuột phải)
    const handleContextMenu = (e: MouseEvent) => {
      // Có thể bật/tắt tùy ý
      // e.preventDefault();
    };

    // Chặn copy/paste
    const handleCopy = (e: ClipboardEvent) => {
      // Có thể bật/tắt tùy ý
      // e.clipboardData?.setData("text/plain", "");
      // e.preventDefault();
    };

    // Chặn drag
    const handleDragStart = (e: DragEvent) => {
      // e.preventDefault();
    };

    // Chặn select text
    const handleSelectStart = (e: Event) => {
      // e.preventDefault();
    };

    // Thêm event listeners
    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("resize", detectDevTools);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("dragstart", handleDragStart);
    document.addEventListener("selectstart", handleSelectStart);

    // Kiểm tra định kỳ
    const interval = setInterval(() => {
      detectDevTools();
      detectConsole();
    }, 500);

    // Cleanup
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("resize", detectDevTools);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("dragstart", handleDragStart);
      document.removeEventListener("selectstart", handleSelectStart);
      clearInterval(interval);
    };
  }, []);

  return null;
}

