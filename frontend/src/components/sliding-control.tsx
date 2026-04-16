"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

type SlidingControlItem = {
  id: string;
  label: string;
};

type IndicatorStyle = {
  width: number;
  x: number;
  visible: boolean;
};

export function SlidingControl({
  ariaLabel,
  className = "",
  items,
  onChange,
  value,
}: {
  ariaLabel: string;
  className?: string;
  items: readonly SlidingControlItem[];
  onChange: (value: string) => void;
  value: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const cleanupDragRef = useRef<(() => void) | null>(null);
  const previewValueRef = useRef<string | null>(null);
  const dragStateRef = useRef<{
    moved: boolean;
    pointerId: number | null;
    startX: number;
  }>({
    moved: false,
    pointerId: null,
    startX: 0,
  });
  const suppressClickRef = useRef(false);
  const [previewValue, setPreviewValue] = useState<string | null>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<IndicatorStyle>({
    width: 0,
    x: 0,
    visible: false,
  });

  const activeValue = previewValue ?? value;

  const measureIndicator = useCallback(() => {
    const container = containerRef.current;
    const activeButton = buttonRefs.current[activeValue];

    if (!container || !activeButton) {
      setIndicatorStyle((current) => ({ ...current, visible: false }));
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const buttonRect = activeButton.getBoundingClientRect();

    setIndicatorStyle({
      width: buttonRect.width,
      x: buttonRect.left - containerRect.left,
      visible: true,
    });
  }, [activeValue]);

  useLayoutEffect(() => {
    measureIndicator();
  }, [measureIndicator]);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const observer = new ResizeObserver(() => {
      measureIndicator();
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [measureIndicator]);

  useEffect(() => {
    const handleResize = () => {
      measureIndicator();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [measureIndicator]);

  const resolveValueFromClientX = useCallback(
    (clientX: number) => {
      let matchedId: string | null = null;
      let nearestId: string | null = null;
      let nearestDistance = Number.POSITIVE_INFINITY;

      for (const item of items) {
        const node = buttonRefs.current[item.id];

        if (!node) {
          continue;
        }

        const rect = node.getBoundingClientRect();

        if (clientX >= rect.left && clientX <= rect.right) {
          matchedId = item.id;
          break;
        }

        const distance = Math.abs(clientX - (rect.left + rect.right) / 2);

        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestId = item.id;
        }
      }

      return matchedId ?? nearestId ?? value;
    },
    [items, value],
  );

  const beginDrag = useCallback((pointerId: number, clientX: number) => {
    const nextValue = resolveValueFromClientX(clientX);

    dragStateRef.current = {
      moved: false,
      pointerId,
      startX: clientX,
    };
    previewValueRef.current = nextValue;
    setPreviewValue(nextValue);
  }, [resolveValueFromClientX]);

  const finishDrag = useCallback((pointerId: number, clientX: number, commit: boolean) => {
    if (dragStateRef.current.pointerId !== pointerId) {
      return;
    }

    const nextValue = dragStateRef.current.moved
      ? resolveValueFromClientX(clientX)
      : previewValueRef.current;

    if (commit && dragStateRef.current.moved && nextValue !== null && nextValue !== value) {
      suppressClickRef.current = true;
      onChange(nextValue);
    }

    dragStateRef.current = {
      moved: false,
      pointerId: null,
      startX: 0,
    };
    previewValueRef.current = null;
    setPreviewValue(null);
  }, [onChange, resolveValueFromClientX, value]);

  useEffect(() => {
    return () => {
      cleanupDragRef.current?.();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`sliding-control${className ? ` ${className}` : ""}`}
      role="group"
      aria-label={ariaLabel}
      onPointerDown={(event) => {
        if (event.pointerType === "mouse" && event.button !== 0) {
          return;
        }

        beginDrag(event.pointerId, event.clientX);
        cleanupDragRef.current?.();

        const handlePointerMove = (moveEvent: PointerEvent) => {
          if (dragStateRef.current.pointerId !== moveEvent.pointerId) {
            return;
          }

          if (Math.abs(moveEvent.clientX - dragStateRef.current.startX) > 4) {
            dragStateRef.current.moved = true;
          }

          const nextValue = resolveValueFromClientX(moveEvent.clientX);
          previewValueRef.current = nextValue;
          setPreviewValue(nextValue);
        };

        const handlePointerEnd = (endEvent: PointerEvent) => {
          if (dragStateRef.current.pointerId !== endEvent.pointerId) {
            return;
          }

          const shouldCommit = endEvent.type !== "pointercancel";
          finishDrag(endEvent.pointerId, endEvent.clientX, shouldCommit);
          cleanupDragRef.current?.();
          cleanupDragRef.current = null;
        };

        window.addEventListener("pointermove", handlePointerMove, { passive: true });
        window.addEventListener("pointerup", handlePointerEnd);
        window.addEventListener("pointercancel", handlePointerEnd);

        cleanupDragRef.current = () => {
          window.removeEventListener("pointermove", handlePointerMove);
          window.removeEventListener("pointerup", handlePointerEnd);
          window.removeEventListener("pointercancel", handlePointerEnd);
        };
      }}
    >
      <span
        aria-hidden="true"
        className="sliding-control__indicator"
        style={{
          opacity: indicatorStyle.visible ? 1 : 0,
          transform: `translateX(${indicatorStyle.x}px)`,
          width: indicatorStyle.width,
        }}
      />

      {items.map((item) => (
        <button
          key={item.id}
          ref={(node) => {
            buttonRefs.current[item.id] = node;
          }}
          type="button"
          className={`sliding-control__button${value === item.id ? " is-active" : ""}${activeValue === item.id ? " is-preview" : ""}`}
          onClick={(event) => {
            if (suppressClickRef.current) {
              suppressClickRef.current = false;
              event.preventDefault();
              return;
            }

            onChange(item.id);
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
