"use client"

import * as React from "react"
import { OrbitalButton } from "@/components/ui/orbital-button"
import { OrbitalCard } from "@/components/ui/orbital-card"
import { Camera, RefreshCw } from "lucide-react"

interface LiveCaptureProps {
    onCapture: (blob: Blob) => void
}

export function LiveCapture({ onCapture }: LiveCaptureProps) {
    const videoRef = React.useRef<HTMLVideoElement>(null)
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const [stream, setStream] = React.useState<MediaStream | null>(null)
    const [capturedImage, setCapturedImage] = React.useState<string | null>(null)

    const startCamera = React.useCallback(async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user" },
                audio: false,
            })
            setStream(mediaStream)
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream
            }
        } catch (err) {
            console.error("Error accessing camera:", err)
        }
    }, [])

    const stopCamera = React.useCallback(() => {
        if (stream) {
            stream.getTracks().forEach((track) => track.stop())
            setStream(null)
        }
    }, [stream])

    const capturePhoto = React.useCallback(() => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current
            const canvas = canvasRef.current
            const context = canvas.getContext("2d")

            if (context) {
                canvas.width = video.videoWidth
                canvas.height = video.videoHeight
                context.drawImage(video, 0, 0, canvas.width, canvas.height)

                canvas.toBlob((blob) => {
                    if (blob) {
                        onCapture(blob)
                        const url = URL.createObjectURL(blob)
                        setCapturedImage(url)
                        stopCamera()
                    }
                }, "image/jpeg", 0.8)
            }
        }
    }, [onCapture, stopCamera])

    const retake = () => {
        setCapturedImage(null)
        startCamera()
    }

    React.useEffect(() => {
        return () => {
            stopCamera()
        }
    }, [stopCamera])

    return (
        <OrbitalCard className="p-4 flex flex-col items-center gap-4 w-full max-w-sm mx-auto">
            <div className="relative w-full aspect-square bg-black rounded-lg overflow-hidden border-[3px] border-orbital-ink">
                {!capturedImage && (
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                        onLoadedMetadata={() => videoRef.current?.play()}
                    />
                )}
                {capturedImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={capturedImage}
                        alt="Captured identity"
                        className="w-full h-full object-cover"
                    />
                )}
                <canvas ref={canvasRef} className="hidden" />
            </div>

            <div className="flex gap-4 w-full">
                {!capturedImage ? (
                    !stream ? (
                        <OrbitalButton onClick={startCamera} className="w-full" type="button">
                            <Camera className="mr-2 h-4 w-4" />
                            Enable Camera
                        </OrbitalButton>
                    ) : (
                        <OrbitalButton onClick={capturePhoto} className="w-full" type="button">
                            Capture
                        </OrbitalButton>
                    )
                ) : (
                    <OrbitalButton onClick={retake} variant="secondary" className="w-full" type="button">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Retake
                    </OrbitalButton>
                )}
            </div>
        </OrbitalCard>
    )
}
