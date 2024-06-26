import { EmitEventType } from "../../../plugin/types";
import { BaseMsgMethod } from "../base";
import { IworkId } from "../../types";
import { EvevtWorkState } from "../../enum";
export type TranslateNodeEmtData = {
    workIds: IworkId[];
    position: {
        x: number;
        y: number;
    };
    workState: EvevtWorkState;
    viewId: string;
};
export declare class TranslateNodeMethod extends BaseMsgMethod {
    readonly emitEventType: EmitEventType;
    private undoTickerId?;
    private oldRect;
    private cachePosition;
    collect(data: TranslateNodeEmtData): void;
}
