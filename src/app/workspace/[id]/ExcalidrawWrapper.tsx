"use client";

import React from "react";
import { Excalidraw, MainMenu } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import { ArrowLeft } from "lucide-react";
import type { LibraryItems } from "@excalidraw/excalidraw/types";

export default function ExcalidrawWrapper({
    excalidrawRef,
    savedLibraryItems,
    onLibraryChange,
    onBack,
}: {
    excalidrawRef: React.MutableRefObject<any>;
    savedLibraryItems: LibraryItems;
    onLibraryChange: (items: LibraryItems) => void;
    onBack: () => void;
}) {
    return (
        <Excalidraw
            excalidrawAPI={(api) => { excalidrawRef.current = api; }}
            initialData={{
                appState: {
                    viewBackgroundColor: "#ffffff",
                    currentItemFontFamily: 2, // 1=Excalifont, 2=Nunito (clean), 3=Cascadia Code
                },
                libraryItems: savedLibraryItems,
            }}
            onLibraryChange={onLibraryChange}
        >
            <MainMenu>
                <MainMenu.Item icon={<ArrowLeft size={16} />} onSelect={onBack}>
                    Back to Library
                </MainMenu.Item>
                <MainMenu.Separator />
                <MainMenu.DefaultItems.LoadScene />
                <MainMenu.DefaultItems.SaveToActiveFile />
                <MainMenu.DefaultItems.Export />
                <MainMenu.DefaultItems.SaveAsImage />
                <MainMenu.Separator />
                <MainMenu.DefaultItems.Help />
                <MainMenu.DefaultItems.ClearCanvas />
                <MainMenu.Separator />
                <MainMenu.DefaultItems.ToggleTheme />
                <MainMenu.DefaultItems.ChangeCanvasBackground />
            </MainMenu>
        </Excalidraw>
    );
}
