"use client";

import React from "react";
import { m, AnimatePresence } from "motion/react";
import { useRetroState } from "./hooks/useRetroState";
import { RetroBootView, RetroErrorView, RetroDetailsView } from "./retro/RetroViews";
import { Z_LAYERS } from "../utils/zIndexLayers";
import "./retro/retro-os.css";

export default function RetroMobileOverlay() {
    const { 
        step, 
        setStep, 
        progress, 
        locale, 
        copied, 
        siteUrl, 
        handleCopy, 
        handleShare, 
        t 
    } = useRetroState();

    return (
        <div
            className="fixed inset-0 bg-[#c0c0c0] flex items-center justify-center p-6 retro-os-container touch-none select-none overflow-hidden text-[#000]"
            style={{ zIndex: Z_LAYERS.CHROME }}
        >
            <AnimatePresence mode="wait">
                {step === "boot" && (
                    <RetroBootView text={t.boot} />
                )}

                {(step === "error" || step === "details") && (
                    <m.div
                        key="error-box"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="retro-window w-full max-w-[340px]"
                    >
                        <div className="retro-title-bar">
                            <span className="retro-title-text">{t.title}</span>
                        </div>
                        <div className="retro-content flex flex-col items-center gap-4 text-center">
                            {step === "error" ? (
                                <RetroErrorView 
                                    locale={locale} 
                                    restartBtnText={t.restartBtn} 
                                    onRestart={() => setStep("details")} 
                                />
                            ) : (
                                <RetroDetailsView 
                                    progress={progress}
                                    loadingTrans={t.loadingTrans}
                                    siteUrl={siteUrl}
                                    qrInstruction={t.qrInstruction}
                                    copyBtn={t.copyBtn}
                                    shareBtn={t.shareBtn}
                                    backBtn={t.backBtn}
                                    copied={copied}
                                    onCopy={handleCopy}
                                    onShare={handleShare}
                                />
                            )}
                        </div>
                    </m.div>
                )}
            </AnimatePresence>
        </div>
    );
}
