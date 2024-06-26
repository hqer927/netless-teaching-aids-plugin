import { WindowManager } from "@netless/window-manager";
import { BaseTeachingAidsManager, BaseTeachingAidsManagerProps } from "../baseTeachingAidsManager";
import { ViewContainerMultiManager } from "./containerManager";
export declare class TeachingAidsMultiManager extends BaseTeachingAidsManager {
    windowManager?: WindowManager;
    viewContainerManager: ViewContainerMultiManager;
    constructor(params: BaseTeachingAidsManagerProps);
    init(): void;
    destroy(): void;
    activePlugin(): void;
    activeWorker(): void;
    setWindowManager(windowManager: WindowManager): void;
}
