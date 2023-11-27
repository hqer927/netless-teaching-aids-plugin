import { WorkThreadEngine } from "../base";
import { IActiveToolsDataType, IActiveWorkDataType, IBatchMainMessage, IMainMessage, IOffscreenCanvasOptionType, IWorkerMessage } from "../types";
import { EDataType } from "../enum";
import { SubLocalWorkForWorker } from "./local";
import { SubServiceWorkForWorker } from "./service";
import { Scene, Layer } from "spritejs";
export declare class WorkThreadEngineByWorker extends WorkThreadEngine {
    static _self: Worker;
    protected dpr: number;
    protected scene: Scene;
    protected drawLayer: Layer;
    protected fullLayer: Layer;
    protected localWork: SubLocalWorkForWorker;
    protected serviceWork: SubServiceWorkForWorker;
    constructor();
    private init;
    getOffscreen(isFullWork: boolean): OffscreenCanvas;
    private register;
    private remove;
    private updateNode;
    protected updateScene(offscreenCanvasOpt: IOffscreenCanvasOptionType): IMainMessage;
    setToolsOpt(opt: IActiveToolsDataType): void;
    setWorkOpt(opt: Partial<IActiveWorkDataType>): void;
    private clearAll;
    private setTransform;
    private getRectImageBitmap;
    post(msg: IBatchMainMessage): void;
    on(callBack: (msg: IWorkerMessage[]) => void): void;
    consumeDraw(type: EDataType, data: IWorkerMessage): IMainMessage | undefined;
    consumeDrawAll(type: EDataType, data: IWorkerMessage): IMainMessage | undefined;
    consumeFull(type: EDataType, data: IWorkerMessage): void;
}
export declare const worker: WorkThreadEngineByWorker;
