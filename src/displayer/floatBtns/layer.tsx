/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useContext, useEffect, useMemo, useState } from "react";
import { IconURL } from "../icons";
import { DisplayerContext } from "../../plugin";
import { EmitEventType, InternalMsgEmitterType } from "../../plugin/types";
import { MethodBuilderMain } from "../../core/msgEvent";
import { Storage_Selector_key } from "../../collector";
import { ElayerType } from "../../core";
import isEqual from "lodash/isEqual";
import { SubButProps } from ".";
const SubBtn = (props: {
    icon:string;
    onClickHandler:(e: any)=>void;
    onTouchEndHandler:(e: any)=>void;
}) => {
    const { icon, onClickHandler, onTouchEndHandler } = props;
    return (
        <div className="button normal-button" onClick={onClickHandler} onTouchEnd={onTouchEndHandler}>
            <img src={IconURL(icon)}/>
        </div>
    )
}
export const Layer = (props:SubButProps) => {
    const {open: showSubBtn, setOpen: setShowSubBtn} = props;
    const {floatBarData} = useContext(DisplayerContext);
    // const [showSubBtn, setShowSubBtn] = useState(false);
    const [selectIds,setSelectIds] = useState<string[]>([]);
    const SubBtns = useMemo(() => {
        if (showSubBtn) {
            return (
                <div className="image-layer-menu">
                    <SubBtn icon={'to-top'} 
                        onClickHandler={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            MethodBuilderMain.emitMethod(InternalMsgEmitterType.MainEngine, 
                                EmitEventType.ZIndexNode, {workIds:[Storage_Selector_key], layer: ElayerType.Top})
                        }}
                        onTouchEndHandler={(e) => {
                            e.stopPropagation();
                            MethodBuilderMain.emitMethod(InternalMsgEmitterType.MainEngine, 
                                EmitEventType.ZIndexNode, {workIds:[Storage_Selector_key], layer: ElayerType.Top})
                        }}
                    />
                    <SubBtn icon={'to-bottom'} 
                        onClickHandler={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            MethodBuilderMain.emitMethod(InternalMsgEmitterType.MainEngine, 
                                EmitEventType.ZIndexNode, {workIds:[Storage_Selector_key], layer: ElayerType.Bottom})
                        }}
                        onTouchEndHandler={(e) => {
                            e.stopPropagation();
                            MethodBuilderMain.emitMethod(InternalMsgEmitterType.MainEngine, 
                                EmitEventType.ZIndexNode, {workIds:[Storage_Selector_key], layer: ElayerType.Bottom})
                        }}
                    />
                </div>
            )
        }
        return null
    }, [showSubBtn])
    const onClickHandler = (e:any) => {
        e.preventDefault();
        e.stopPropagation();
        e.nativeEvent.stopImmediatePropagation();
        const isActive = !showSubBtn;
        setShowSubBtn(isActive)
        if (isActive) {
            MethodBuilderMain.emitMethod(InternalMsgEmitterType.MainEngine, 
                EmitEventType.ZIndexActive, {workId:Storage_Selector_key, isActive})
        }
    }
    const onTouchEndHandler = (e:any) => {
        e.stopPropagation();
        e.nativeEvent.stopImmediatePropagation();
        const isActive = !showSubBtn;
        setShowSubBtn(isActive)
        MethodBuilderMain.emitMethod(InternalMsgEmitterType.MainEngine, 
            EmitEventType.ZIndexActive, {workId:Storage_Selector_key, isActive})
    }
    useEffect(()=>{
        if (!isEqual(floatBarData?.selectIds, selectIds)) {
            if (floatBarData?.selectIds && !isEqual(floatBarData?.selectIds, selectIds)) {
                setSelectIds(floatBarData?.selectIds);
                setShowSubBtn(false)
            }
        }
    },[showSubBtn, floatBarData, selectIds, setShowSubBtn])
    useEffect(()=>{
        return ()=> {
            if (showSubBtn) {
                MethodBuilderMain.emitMethod(InternalMsgEmitterType.MainEngine, 
                    EmitEventType.ZIndexActive, {workId:Storage_Selector_key, isActive:false})
            }
        }
    },[showSubBtn])
    return (
        <div className={`button normal-button ${showSubBtn && 'active'}`}
            onClick={onClickHandler}
            onTouchEnd={onTouchEndHandler}
        >
            {SubBtns}
            <img alt="icon" src={IconURL(showSubBtn ? 'layer-pressed': 'layer')}/>
        </div>
    )
}