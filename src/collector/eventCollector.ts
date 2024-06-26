import { EventMessageType } from "../core/enum";
import { autorun } from "white-web-sdk";
import { BaseEventCollectorReducerAction, ISerializableEventData } from "./types";
import { BaseCollector } from "./base";
import { requestAsyncCallBack } from "../core/utils";
import { Storage_Splitter } from "./const";
import isEqual from "lodash/isEqual";
import { TeachingAidsPluginLike } from "../plugin/types";
import cloneDeep from "lodash/cloneDeep";
/**
 * 服务端事件/状态同步收集器
 */ 
export class EventCollector extends BaseCollector<ISerializableEventData> {
    static syncInterval: number = 100;
    static namespace: string = 'PluginEvent';
    serviceStorage: ISerializableEventData = {};
    storage: ISerializableEventData = {};
    private stateDisposer: (() => void) | undefined;
    private asyncClockTimer?:number;
    protected namespace!: string;
    constructor(plugin: TeachingAidsPluginLike, syncInterval?: number ){
        super(plugin);
        this.namespace = EventCollector.namespace;
        EventCollector.syncInterval = (syncInterval || EventCollector.syncInterval) * 0.5;
        this.serviceStorage = this.getNamespaceData();
        this.storage = cloneDeep(this.serviceStorage);
    }
    addStorageStateListener(callBack:(event:Map<string,Array<BaseEventCollectorReducerAction | undefined>>)=>void){
        this.stateDisposer = autorun(async () => {
            const storage = this.getNamespaceData();
            const diffMap = this.getDiffMap(this.serviceStorage, storage);
            this.serviceStorage = storage;
            if (diffMap.size) {
                callBack(diffMap);
            }
        })
    }
    private getDiffMap(_old:ISerializableEventData, _new:ISerializableEventData) {
        const diffMap:Map<string,Array<BaseEventCollectorReducerAction | undefined>> = new Map();
        for (const [key,value] of Object.entries(_new)) {
            if (key === this.uid) {
                continue;
            }
            if (value && isEqual(_old[key], value)) {
                continue;
            }
            value && diffMap.set(key,value);
        }
        return diffMap;
    }
    removeStorageStateListener():void {
        if (this.stateDisposer) {
            this.stateDisposer();
        }
    }
    transformKey(workId:number|string){
        return this.uid + Storage_Splitter + workId
    }
    isOwn(key:string){
        return key === this.uid;
    }
    dispatch(action: BaseEventCollectorReducerAction): void {
        const {type, op, isSync, viewId} = action
        switch (type) {
            case EventMessageType.Cursor:
                if (op) {
                    this.pushValue(this.uid, {
                        type: EventMessageType.Cursor,
                        op,
                        viewId
                    }, { isSync });                 
                }
                break;
            default:
                break;
        } 
    }
    pushValue(uid:string, value: BaseEventCollectorReducerAction | undefined, options?:{
        isSync?: boolean
    }){
        if (!this.storage[uid]) {
            this.storage[uid] = [];
        }
        this.storage[uid]?.push(value)
        this.runSyncService(options);
    }
    clearValue(uid:string){
        this.storage[uid] = undefined;
        const length = Object.keys(this.serviceStorage).length;
        if (length) {
            this.plugin?.updateAttributes([this.namespace, uid], undefined);
        }
    }
    private runSyncService(options?:{
        isSync?: boolean;
    } ) {
        if (!this.asyncClockTimer) {
            this.asyncClockTimer = setTimeout(()=>{
                if (options?.isSync) {
                    this.asyncClockTimer = undefined;
                    this.syncSerivice();
                } else {
                    requestAsyncCallBack(()=>{
                        this.asyncClockTimer = undefined;
                        this.syncSerivice();
                    }, EventCollector.syncInterval);
                }
            }, options?.isSync ? 0 : EventCollector.syncInterval) as unknown as number;
        }
    }
    private syncSerivice() {
        const length = Object.keys(this.serviceStorage).length;
        if (!length) {
            this.plugin?.updateAttributes(this.namespace, this.storage);
        } else {
            Object.keys(this.storage).forEach((uid)=>{
                this.plugin?.updateAttributes([this.namespace, uid], this.storage[uid]);
            })
        }
        this.storage = {};
    }
    destroy(){
        this.removeStorageStateListener();
        this.storage = {};
        this.serviceStorage = {};
    }
}