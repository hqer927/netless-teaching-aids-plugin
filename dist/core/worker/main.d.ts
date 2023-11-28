import { BaseCollector } from "../../collector";
import { BaseCollectorReducerAction, DiffOne } from "../../collector/types";
import { MainEngine, WorkThreadEngine } from "../base";
import { IOffscreenCanvasOptionType, ICameraOpt, IActiveToolsDataType, IActiveWorkDataType, IWorkerMessage, ILayerOptionType, IworkId, IUpdateNodeOpt } from "../types";
import { ECanvasContextType, EDataType, EPostMessageType } from "../enum";
import { BezierPencilPluginOptions } from "../../plugin";
export declare class MainEngineForWorker extends MainEngine {
    protected threadEngine?: WorkThreadEngine;
    private pluginOptions?;
    static defaultScreenCanvasOpt: {
        autoRender: boolean;
        contextType: ECanvasContextType;
    };
    static defauleLayerOpt: {
        offscreen: boolean;
        handleEvent: boolean;
        depth: boolean;
    };
    static maxLastSyncTime: number;
    protected layerOpt: ILayerOptionType;
    protected msgEmitter: Worker;
    protected offscreenCanvasOpt: IOffscreenCanvasOptionType;
    protected cameraOpt: ICameraOpt;
    protected translate: [number, number];
    protected localPointsBatchData: number[];
    protected taskBatchData: (IWorkerMessage & Pick<IWorkerMessage, 'workId'>)[];
    protected currentToolsData: IActiveToolsDataType;
    protected currentLocalWorkData: IActiveWorkDataType;
    private animationId;
    private workerLockId;
    private isRunSubWork;
    private subWorker;
    private maxDrawCount;
    private wokerDrawCount;
    private reRenders;
    constructor(bgCanvas: HTMLCanvasElement, floatCanvas: HTMLCanvasElement, collector: BaseCollector, options?: BezierPencilPluginOptions);
    private createOptimizationWorker;
    private subPost;
    private destroySubWorker;
    private createThreadEngine;
    private render;
    private runAnimation;
    private setLayerOpt;
    updateCanvas(opt: IOffscreenCanvasOptionType, dataType: EDataType): void;
    private pushPoint;
    private transformToScenePoint;
    initSyncData(callBack: (key: string, value: BaseCollectorReducerAction | undefined) => void): void;
    onServiceDerive(key: string, data: DiffOne<BaseCollectorReducerAction | undefined>): void;
    onLocalEventEnd(point: [number, number]): void;
    onLocalEventDoing(point: [number, number]): void;
    onLocalEventStart(point: [number, number]): void;
    consume(): void;
    clearAll(justLocal?: boolean): void;
    unabled(): void;
    abled(): void;
    destroy(): void;
    post(msg: IWorkerMessage[]): void;
    on(): void;
    private collectorSyncData;
    updateNode(workId: IworkId, updateNodeOpt: IUpdateNodeOpt): void;
    setCurrentLocalWorkData(currentLocalWorkData: IActiveWorkDataType, msgType?: EPostMessageType): void;
    setCurrentToolsData(currentToolsData: IActiveToolsDataType): void;
    setCameraOpt(cameraOpt: ICameraOpt): void;
}