/// <reference types="react" />
/// <reference types="lodash" />
import type EventEmitter2 from "eventemitter2";
import { ICameraOpt, ILayerOptionType, IMainMessageRenderData, IOffscreenCanvasOptionType } from "../core/types";
import { BaseSubWorkModuleProps, TeachingAidsManagerLike } from "./types";
import type { CameraState, RoomMember, View } from "white-web-sdk";
import { ShowFloatBarMsgValue } from "../displayer/types";
import { UndoRedoMethod } from "../undo";
import { BaseViewDisplayer } from "./displayerView";
export interface ViewInfo {
    id: string;
    focusScenePath: string;
    displayer: MainViewDisplayerManager | AppViewDisplayerManager;
    container?: HTMLDivElement;
    cameraOpt?: ICameraOpt;
    viewData?: View;
    [key: string]: any;
}
/** view容器管理器抽象 */
export declare abstract class ViewContainerManager {
    static defaultCameraOpt: Pick<ICameraOpt, 'centerX' | 'centerY' | 'scale'>;
    static defaultScreenCanvasOpt: Pick<IOffscreenCanvasOptionType, 'autoRender' | 'contextType'>;
    static defaultLayerOpt: Pick<ILayerOptionType, 'offscreen' | 'handleEvent' | 'depth'>;
    internalMsgEmitter: EventEmitter2;
    control: TeachingAidsManagerLike;
    abstract focuedViewId?: string;
    abstract focuedView?: ViewInfo;
    mainView?: ViewInfo;
    appViews: Map<string, ViewInfo>;
    constructor(props: BaseSubWorkModuleProps);
    undoTickerStart(id: number, viewId: string): void;
    undoTickerEnd(id: number, viewId: string): void;
    addExcludeIds(ids: string[], viewId: string): void;
    undo(): number;
    redo(): number;
    protected validator(target: ViewInfo, key: string, value: any): void;
    destroyAppView(viewId: string): void;
    createMianView(originMainView: ViewInfo): void;
    createAppView(originAppView: ViewInfo): void;
    isAppView(viewId: string): boolean;
    getView(viewId: string): ViewInfo | undefined;
    getCurScenePath(viewId: string): string | undefined;
    getAllViews(): (ViewInfo | undefined)[];
    setViewScenePath(viewId: string, scenePath: string): void;
    setViewData(viewId: string, viewData: View): void;
    setFocuedViewId(viewId: string): void;
    setViewFocusScenePath(viewId: string, scenePath: string): void;
    /** 销毁 */
    destroy(): void;
    abstract mountView(viewIde: string): void;
    abstract setFocuedViewCameraOpt(cameraState: CameraState): void;
    /** view中心点坐标转换成页面原始坐标 */
    abstract transformToOriginPoint(point: [number, number], viewId: string): [number, number];
    /** 页面坐标转换成view中心点坐标 */
    abstract transformToScenePoint(point: [number, number], viewId: string): [number, number];
    /** 绘制view */
    abstract render(renderData: Array<IMainMessageRenderData>): void;
    /** 是否绘制浮动选框 */
    showFloatBar(viewId: string, isShow: boolean, opt?: Partial<ShowFloatBarMsgValue>): void;
    /** 激活浮动选框 */
    activeFloatBar(viewId: string): void;
    /** 销毁浮动选框 */
    unActiveFloatBar(viewId: string): void;
    /** 激活刷新指针 */
    setActiveCursor(viewId: string, cursorInfo: {
        x?: number;
        y?: number;
        roomMember?: RoomMember;
    }): void;
    /** 激活刷新文字编辑器 */
    setActiveTextEditor(viewId: string, activeTextId?: string): void;
}
/** appView容器管理器抽象 */
export declare abstract class AppViewDisplayerManager {
    viewId: string;
    abstract dpr: number;
    abstract width: number;
    abstract height: number;
    readonly control: TeachingAidsManagerLike;
    readonly internalMsgEmitter: EventEmitter2;
    readonly commiter: UndoRedoMethod;
    abstract vDom?: BaseViewDisplayer;
    abstract eventTragetElement?: HTMLDivElement;
    abstract canvasFloatRef: React.RefObject<HTMLCanvasElement>;
    abstract canvasBgRef: React.RefObject<HTMLCanvasElement>;
    abstract floatBarRef: React.RefObject<HTMLDivElement>;
    abstract floatBarCanvasRef: React.RefObject<HTMLCanvasElement>;
    abstract containerOffset: {
        x: number;
        y: number;
    };
    private cachePoint?;
    private cacheCursorPoint?;
    constructor(viewId: string, control: TeachingAidsManagerLike, internalMsgEmitter: EventEmitter2);
    abstract setCanvassStyle(): void;
    bindToolsClass(): void;
    mountView(): void;
    reflashContainerOffset(): void;
    updateSize(): void;
    setViewId(viewId: string): void;
    destroy(): void;
    getPoint(e: any): [number, number] | undefined;
    private getTranslate;
    protected getContainerOffset(eventTraget: HTMLDivElement, offset: {
        x: number;
        y: number;
    }): {
        x: any;
        y: any;
    };
    protected mousedown: (e: MouseEvent) => void;
    protected mousemove: (e: MouseEvent) => void;
    protected mouseup: (e: MouseEvent) => void;
    protected touchstart: (e: TouchEvent) => void;
    protected touchmove: import("lodash").DebouncedFunc<(e: TouchEvent) => void>;
    protected touchend: (e: TouchEvent) => void;
    cursorMouseMove: import("lodash").DebouncedFunc<(e: MouseEvent) => void>;
    protected cursorMouseLeave: import("lodash").DebouncedFunc<() => void>;
    protected bindDisplayerEvent(div: HTMLDivElement): void;
    protected removeDisplayerEvent(div: HTMLDivElement): void;
}
/** 主容器管理器抽象 */
export declare abstract class MainViewDisplayerManager {
    static readonly viewId: string;
    readonly viewId: string;
    readonly control: TeachingAidsManagerLike;
    readonly internalMsgEmitter: EventEmitter2;
    readonly commiter: UndoRedoMethod;
    abstract dpr: number;
    abstract width: number;
    abstract height: number;
    abstract vDom?: BaseViewDisplayer;
    abstract eventTragetElement?: HTMLDivElement;
    abstract canvasFloatRef: React.RefObject<HTMLCanvasElement>;
    abstract canvasBgRef: React.RefObject<HTMLCanvasElement>;
    abstract floatBarRef: React.RefObject<HTMLDivElement>;
    abstract floatBarCanvasRef: React.RefObject<HTMLCanvasElement>;
    abstract containerOffset: {
        x: number;
        y: number;
    };
    private cachePoint?;
    private cacheCursorPoint?;
    constructor(control: TeachingAidsManagerLike, internalMsgEmitter: EventEmitter2);
    abstract setCanvassStyle(): void;
    bindToolsClass(): void;
    mountView(): void;
    updateSize(): void;
    reflashContainerOffset(): void;
    destroy(): void;
    getPoint(e: any): [number, number] | undefined;
    private getTranslate;
    protected getContainerOffset(eventTraget: HTMLDivElement, offset: {
        x: number;
        y: number;
    }): {
        x: any;
        y: any;
    };
    protected mousedown: (e: MouseEvent) => void;
    protected mousemove: (e: MouseEvent) => void;
    protected mouseup: (e: MouseEvent) => void;
    protected touchstart: (e: TouchEvent) => void;
    protected touchmove: import("lodash").DebouncedFunc<(e: TouchEvent) => void>;
    protected touchend: (e: TouchEvent) => void;
    cursorMouseMove: import("lodash").DebouncedFunc<(e: MouseEvent) => void>;
    protected cursorMouseLeave: import("lodash").DebouncedFunc<() => void>;
    protected bindDisplayerEvent(div: HTMLDivElement): void;
    protected removeDisplayerEvent(div: HTMLDivElement): void;
}
