import React, { useCallback, useEffect, useRef } from "react";

export function useElementSync() {
    const syncContainedElement = useCallback(
        (
            element: HTMLElement,
            container: HTMLElement,
            naturalWidth: number,
            naturalHeight: number,
            extraStyles: Partial<CSSStyleDeclaration> = {}
        ) => {
            if (!naturalWidth || !naturalHeight) return;

            const { clientWidth, clientHeight } = container;
            if (!clientWidth || !clientHeight) return;

            const scale = Math.min(
                clientWidth / naturalWidth,
                clientHeight / naturalHeight
            );
            const width = Math.max(1, Math.round(naturalWidth * scale));
            const height = Math.max(1, Math.round(naturalHeight * scale));

            Object.assign(element.style, {
                width: `${width}px`,
                height: `${height}px`,
                position: "absolute",
                top: "50%",
                left: "50%",
                marginTop: `-${height / 2}px`,
                marginLeft: `-${width / 2}px`,
                ...extraStyles,
            });
        },
        []
    );

    return { syncContainedElement };
}

export interface SyncedElementOptions {
    displayUrl?: string | null;
    isFftActive?: boolean;
    extraStyles?: Partial<CSSStyleDeclaration>;
}

export function useSyncedElement(
    sourceRef: React.RefObject<HTMLImageElement | null>,
    targetRef: React.RefObject<HTMLElement | null>,
    containerRef: React.RefObject<HTMLElement | null>,
    options: SyncedElementOptions = {}
) {
    const { displayUrl, isFftActive, extraStyles } = options;
    const { syncContainedElement } = useElementSync();
    const extraStylesRef = useRef(extraStyles);
    extraStylesRef.current = extraStyles;

    useEffect(() => {
        const source = sourceRef.current;
        const target = targetRef.current;
        const container = containerRef.current;

        if (!source || !target || !container) return undefined;

        const sync = () => {
            requestAnimationFrame(() => {
                if (!source || !target || !container) return;

                syncContainedElement(
                    target,
                    container,
                    source.naturalWidth,
                    source.naturalHeight,
                    extraStylesRef.current
                );
            });
        };

        const resizeObserver = new ResizeObserver(sync);
        resizeObserver.observe(container);

        if (source.complete) sync();
        source.addEventListener("load", sync);

        return () => {
            resizeObserver.disconnect();
            source.removeEventListener("load", sync);
        };
    }, [
        containerRef,
        displayUrl,
        isFftActive,
        sourceRef,
        syncContainedElement,
        targetRef,
    ]);
}
