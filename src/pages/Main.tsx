import React, { useEffect, useRef, useState } from "react";
import "../App.css";
import Cropper from "../component/Cropper";
import Select from "../component/Select";
import About from "../component/About";
import AdjustmentsPanel from "../component/AdjustmentsPanel";
import EffectFilters from "../component/EffectFilters";
import QualityPanel from "../component/QualityPanel";
import A2HSButton from "../A2HSButton";
import { PDFMaster } from "../components/PDFMaster";
import { MolView } from "../components/MolView";
// import { VirtualKeyboard, FloatingKeyboardButton } from "../components/VirtualKeyboard";

// Helper function for async image loading
const loadImageAsync = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
        img.src = src;
    });
};

// Extended font families list
const FONT_FAMILIES = [
    'Arial, sans-serif',
    'Times New Roman, serif',
    'Helvetica, sans-serif',
    'Georgia, serif',
    'Verdana, sans-serif',
    'Courier New, monospace',
    'cursive',
    'fantasy',
    'Impact, sans-serif',
    'Comic Sans MS, cursive',
    'Trebuchet MS, sans-serif',
    'Palatino, serif',
    'Garamond, serif',
    'Futura, sans-serif',
    'Optima, sans-serif',
    'Gill Sans, sans-serif',
    'Baskerville, serif',
    'Rockwell, serif',
    'Franklin Gothic, sans-serif',
    'Copperplate, serif'
];

// Extended border styles list
const BORDER_STYLES = [
    'solid',
    'dashed', 
    'dotted',
    'double',
    'groove',
    'ridge',
    'inset',
    'outset',
    'wavy',
    'zigzag',
    'decorative'
];

// Helper function for drawing rounded rectangles
const drawRoundedRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
) => {
    ctx.beginPath();
    
    // Fallback for older browsers that don't support roundRect
    if (typeof (ctx as any).roundRect === 'function') {
        (ctx as any).roundRect(x, y, width, height, radius);
    } else {
        // Manual rounded rectangle implementation
        ctx.moveTo(x + radius, y);
        ctx.arcTo(x + width, y, x + width, y + height, radius);
        ctx.arcTo(x + width, y + height, x, y + height, radius);
        ctx.arcTo(x, y + height, x, y, radius);
        ctx.arcTo(x, y, x + width, y, radius);
    }
    
    ctx.closePath();
};


const cropSizePresets = [
    {name: "Custom", value: null},
    {name: "256x256", value: {width: 256, height: 256}},
    {name: "512x512", value: {width: 512, height: 512}},
    {name: "1:1 Square", value: {width: 300, height: 300}},
    {name: "4:3 Standard", value: {width: 400, height: 300}},
    {name: "3:2 Photo", value: {width: 450, height: 300}},
    {name: "16:9 Widescreen", value: {width: 480, height: 270}},
]

interface ProcessingJob {
    id: string;
    name: string;
    progress: number;
    total: number;
    status: 'processing' | 'completed' | 'error';
    type: 'pdf' | 'zip';
    result?: any;
    timestamp: number;
}

interface HistoryItem {
    id: string;
    name: string;
    timestamp: number;
    files: any[];
    crops: any;
    settings: any;
    exportedFiles?: any[];
}

interface CropTab {
    id: string;
    name: string;
    files: any[];
    crops: any;
    settings: any;
    isActive: boolean;
}

// Decorative Status Bar Buffer Component
const StatusBarBuffer = () => {
    const [glowIntensity, setGlowIntensity] = useState(0.5);

    useEffect(() => {
        const interval = setInterval(() => {
            setGlowIntensity(Math.random() * 0.5 + 0.5);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div style={{
            height: '120px', // 2-3 status bar heights
            background: `
                linear-gradient(135deg,
                    rgba(0, 20, 40, 0.95) 0%,
                    rgba(0, 40, 80, 0.9) 25%,
                    rgba(0, 60, 120, 0.85) 50%,
                    rgba(0, 40, 80, 0.9) 75%,
                    rgba(0, 20, 40, 0.95) 100%
                )
            `,
            position: 'relative',
            overflow: 'hidden',
            borderBottom: '3px solid rgba(0, 255, 255, 0.4)',
            boxShadow: '0 4px 20px rgba(0, 255, 255, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            {/* Animated Circuit Pattern Background */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `
                    repeating-linear-gradient(
                        45deg,
                        transparent 0px,
                        rgba(0, 255, 255, 0.03) 2px,
                        transparent 4px
                    ),
                    repeating-linear-gradient(
                        -45deg,
                        transparent 0px,
                        rgba(0, 191, 255, 0.02) 2px,
                        transparent 4px
                    )
                `,
                animation: 'circuitMove 8s linear infinite'
            }} />

            {/* Floating Geometric Shapes */}
            <div style={{
                position: 'absolute',
                top: '15px',
                left: '20px',
                width: '30px',
                height: '30px',
                border: '2px solid rgba(0, 255, 255, 0.6)',
                borderRadius: '50%',
                animation: 'float 3s ease-in-out infinite'
            }} />
            
            <div style={{
                position: 'absolute',
                top: '20px',
                right: '30px',
                width: '25px',
                height: '25px',
                background: 'linear-gradient(45deg, rgba(0, 255, 255, 0.3), rgba(0, 128, 255, 0.3))',
                transform: 'rotate(45deg)',
                animation: 'float 4s ease-in-out infinite reverse'
            }} />

            <div style={{
                position: 'absolute',
                bottom: '15px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '40px',
                height: '2px',
                background: `linear-gradient(90deg, 
                    transparent, 
                    rgba(0, 255, 255, ${glowIntensity}), 
                    transparent
                )`,
                borderRadius: '1px',
                boxShadow: `0 0 10px rgba(0, 255, 255, ${glowIntensity})`
            }} />

            {/* Central Brand Element */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                zIndex: 2
            }}>
                <div style={{
                    width: '50px',
                    height: '50px',
                    background: `
                        radial-gradient(circle,
                            rgba(0, 255, 255, 0.8) 0%,
                            rgba(0, 128, 255, 0.6) 50%,
                            rgba(0, 40, 80, 0.9) 100%
                        )
                    `,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid rgba(0, 255, 255, 0.5)',
                    boxShadow: `0 0 25px rgba(0, 255, 255, ${glowIntensity})`,
                    animation: 'pulse 2s ease-in-out infinite'
                }}>
                    <span style={{
                        fontSize: '24px',
                        filter: 'drop-shadow(0 0 8px rgba(0, 255, 255, 0.8))'
                    }}>✨</span>
                </div>
                
                <div style={{
                    color: '#00ffff',
                    fontFamily: "'Orbitron', monospace",
                    fontSize: '20px',
                    fontWeight: 'bold',
                    textShadow: `0 0 15px rgba(0, 255, 255, ${glowIntensity})`,
                    letterSpacing: '2px',
                    textTransform: 'uppercase'
                }}>
                    Smart Image Cropper
                </div>
                
                <div style={{
                    width: '50px',
                    height: '50px',
                    background: `
                        radial-gradient(circle,
                            rgba(0, 255, 255, 0.8) 0%,
                            rgba(0, 128, 255, 0.6) 50%,
                            rgba(0, 40, 80, 0.9) 100%
                        )
                    `,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid rgba(0, 255, 255, 0.5)',
                    boxShadow: `0 0 25px rgba(0, 255, 255, ${glowIntensity})`,
                    animation: 'pulse 2s ease-in-out infinite 0.5s'
                }}>
                    <span style={{
                        fontSize: '24px',
                        filter: 'drop-shadow(0 0 8px rgba(0, 255, 255, 0.8))'
                    }}>📸</span>
                </div>
            </div>

            {/* Corner Tech Elements */}
            <div style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                width: '15px',
                height: '15px',
                border: '2px solid rgba(0, 255, 255, 0.6)',
                borderRight: 'none',
                borderBottom: 'none',
                borderRadius: '3px 0 0 0'
            }} />
            
            <div style={{
                position: 'absolute',
                bottom: '10px',
                right: '10px',
                width: '15px',
                height: '15px',
                border: '2px solid rgba(0, 255, 255, 0.6)',
                borderLeft: 'none',
                borderTop: 'none',
                borderRadius: '0 0 3px 0'
            }} />
        </div>
    );
};

// Welcome Page Component with Tools and Changing Thoughts
const WelcomePageWithTools = ({ onSelectSomeFiles, onSelectFolder }: { onSelectSomeFiles: () => void, onSelectFolder: () => void }) => {
    const [currentThought, setCurrentThought] = useState(0);

    const wonderfulThoughts = [
        "✨ Transform your images with precision and creativity",
        "🎨 Every pixel tells a story, make yours spectacular",
        "🚀 Unleash the power of digital image processing",
        "💎 Crafting visual excellence, one crop at a time",
        "🌟 Where innovation meets imagination in photography",
        "🔮 Discover the magic hidden in every image",
        "⚡ Lightning-fast editing with professional results",
        "🎯 Precision cropping for perfect compositions",
        "🌈 Bring your visual dreams to life",
        "💫 Elevate your images to extraordinary heights",
        "🏆 Professional-grade tools for creative minds",
        "🎪 Step into the circus of endless possibilities",
        "🔥 Ignite your creativity with powerful features",
        "🌊 Dive deep into the ocean of image perfection",
        "🎭 Master the art of visual storytelling"
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentThought((prev) => (prev + 1) % wonderfulThoughts.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [wonderfulThoughts.length]);

    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "auto",
            minHeight: "400px",
            gap: "25px",
            alignItems: "stretch",
            justifyContent: "center",
            padding: "20px",
            overflow: "hidden",
            boxSizing: "border-box"
        }}>
            {/* Main Content - Single Column */}
            <div style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                gap: "25px",
                alignItems: "stretch",
                maxWidth: "100%",
                justifyContent: "center"
            }}>
                <h1 onClick={onSelectSomeFiles}
                    className="select-some-files"
                    style={{
                        background: 'linear-gradient(45deg, #00ffff, #0080ff, #00ffff)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        fontSize: '2.6em',
                        textShadow: '0 0 30px rgba(0, 255, 255, 0.5)',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        margin: '0',
                        textAlign: 'center'
                    }}
                >📸 Select some files (supports 100+ images)</h1>

                <h2 onClick={onSelectFolder}
                    className="select-some-files"
                    style={{
                        fontSize: "1.6em",
                        margin: "0",
                        color: '#00bfff',
                        textShadow: '0 0 15px rgba(0, 191, 255, 0.5)',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        textAlign: 'center'
                    }}
                >📁 Or select a folder with images</h2>

                {/* Combined Section - Inspiration and Shortcuts */}
                <div style={{
                    width: "100%",
                    display: "flex",
                    gap: "25px",
                    alignItems: "stretch",
                    justifyContent: "stretch",
                    flexWrap: "nowrap"
                }}>
                    {/* Inspiration Section - Now Wider */}
                    <div style={{
                        flex: "3",
                        minWidth: "450px",
                        background: `
                            linear-gradient(135deg,
                                rgba(0, 40, 80, 0.9) 0%,
                                rgba(0, 60, 120, 0.8) 25%,
                                rgba(0, 80, 160, 0.7) 50%,
                                rgba(0, 60, 120, 0.8) 75%,
                                rgba(0, 40, 80, 0.9) 100%
                            )
                        `,
                        border: '3px solid rgba(0, 255, 255, 0.4)',
                        borderRadius: '20px',
                        padding: '30px',
                        boxShadow: `
                            0 0 40px rgba(0, 255, 255, 0.3),
                            inset 0 0 30px rgba(0, 255, 255, 0.1)
                        `,
                        position: 'relative',
                        overflow: 'hidden',
                        height: '220px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center'
                    }}>
                        {/* Animated background patterns */}
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: `
                                repeating-conic-gradient(
                                    from 0deg at 50% 50%,
                                    transparent 0deg,
                                    rgba(0, 255, 255, 0.03) 30deg,
                                    transparent 60deg
                                )
                            `,
                            animation: 'rotate 20s linear infinite'
                        }} />

                        {/* Corner Accents */}
                        <div style={{
                            position: 'absolute',
                            top: '12px',
                            left: '12px',
                            width: '20px',
                            height: '20px',
                            border: '2px solid #00ffff',
                            borderRight: 'none',
                            borderBottom: 'none',
                            borderRadius: '3px 0 0 0'
                        }} />
                        <div style={{
                            position: 'absolute',
                            bottom: '12px',
                            right: '12px',
                            width: '20px',
                            height: '20px',
                            border: '2px solid #00ffff',
                            borderLeft: 'none',
                            borderTop: 'none',
                            borderRadius: '0 0 3px 0'
                        }} />

                        {/* Main Content */}
                        <div style={{ position: 'relative', zIndex: 2, width: '100%' }}>
                            <h3 style={{
                                color: '#00ffff',
                                fontFamily: "'Orbitron', monospace",
                                fontSize: '18px',
                                fontWeight: 'bold',
                                textTransform: 'uppercase',
                                letterSpacing: '1.5px',
                                marginBottom: '20px',
                                textShadow: '0 0 15px rgba(0, 255, 255, 0.8)',
                                margin: '0 0 20px 0'
                            }}>
                                💭 Inspiration
                            </h3>
                            <p style={{
                                color: '#00bfff',
                                fontSize: '16px',
                                lineHeight: '1.6',
                                fontWeight: '500',
                                textShadow: '0 0 10px rgba(0, 191, 255, 0.5)',
                                animation: 'fadeInOut 5s ease-in-out infinite',
                                minHeight: '50px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0'
                            }}>
                                {wonderfulThoughts[currentThought]}
                            </p>

                            {/* Progress indicator */}
                            <div style={{
                                marginTop: '20px',
                                display: 'flex',
                                justifyContent: 'center',
                                gap: '6px',
                                flexWrap: 'wrap'
                            }}>
                                {wonderfulThoughts.slice(0, 8).map((_, index) => (
                                    <div
                                        key={index}
                                        style={{
                                            width: index === (currentThought % 8) ? '12px' : '6px',
                                            height: '6px',
                                            background: index === (currentThought % 8) ? '#00ffff' : 'rgba(0, 255, 255, 0.3)',
                                            borderRadius: '3px',
                                            transition: 'all 0.3s ease',
                                            boxShadow: index === (currentThought % 8) ? '0 0 8px rgba(0, 255, 255, 0.8)' : 'none'
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Keyboard Shortcuts Section */}
                    <div style={{
                        flex: "1",
                        minWidth: "280px",
                        background: "linear-gradient(135deg, rgba(0, 20, 40, 0.9), rgba(0, 40, 80, 0.8))",
                        padding: "25px",
                        borderRadius: "20px",
                        border: "2px solid rgba(0, 255, 255, 0.3)",
                        boxShadow: "0 0 30px rgba(0, 255, 255, 0.2)",
                        height: "220px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center"
                    }}>
                        <h3 style={{
                            color: "#00ffff",
                            marginBottom: "15px",
                            fontFamily: "'Orbitron', monospace",
                            textTransform: "uppercase",
                            letterSpacing: "1px",
                            textShadow: "0 0 10px rgba(0, 255, 255, 0.8)",
                            fontSize: "16px",
                            margin: "0 0 15px 0",
                            textAlign: "center"
                        }}>⌨️ Keyboard Shortcuts</h3>
                        <div style={{
                            fontSize: "0.9em",
                            color: "#00bfff",
                            textAlign: "left",
                            display: "grid",
                            gridTemplateColumns: "1fr",
                            gap: "8px"
                        }}>
                            <div>• <strong>Ctrl+O</strong> - Open Files</div>
                            <div>• <strong>Ctrl+F</strong> - Open Folder</div>
                            <div>• <strong>Ctrl+A</strong> - Select All</div>
                            <div>• <strong>Ctrl+E</strong> - Export Images</div>
                            <div>• <strong>Ctrl+Z</strong> - Export as ZIP</div>
                            <div>• <strong>Ctrl+P</strong> - Export as PDF</div>
                            <div>• <strong>Escape</strong> - Clear Selection</div>
                        </div>
                    </div>
                </div>

                    {/* PWA Install Button */}
                    <div style={{
                        display: "flex",
                        justifyContent: "center",
                        marginTop: "20px"
                    }}>
                        <A2HSButton />
                </div>
            </div>
        </div>
    );
};

// Draggable Panel Component
const DraggablePanel = ({
    title,
    onClose,
    children,
    initialPosition,
    initialSize,
    borderColor = '#007bff'
}: {
    title: string;
    onClose: () => void;
    children: React.ReactNode;
    initialPosition: { x: number; y: number };
    initialSize: { width: number; height: number };
    borderColor?: string;
}) => {
    const [position, setPosition] = useState(initialPosition);
    const [size, setSize] = useState(initialSize);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const dragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number }>({
        startX: 0,
        startY: 0,
        startPosX: 0,
        startPosY: 0
    });

    const handleMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('.no-drag')) return;

        setIsDragging(true);
        dragRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            startPosX: position.x,
            startPosY: position.y
        };
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging && !isResizing) return;

        if (isDragging) {
            const deltaX = e.clientX - dragRef.current.startX;
            const deltaY = e.clientY - dragRef.current.startY;

            setPosition({
                x: Math.max(0, Math.min(window.innerWidth - size.width, dragRef.current.startPosX + deltaX)),
                y: Math.max(0, Math.min(window.innerHeight - size.height, dragRef.current.startPosY + deltaY))
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        setIsResizing(false);
    };

    useEffect(() => {
        if (isDragging || isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);

            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, isResizing, position, size]);

    const handleResize = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsResizing(true);

        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = size.width;
        const startHeight = size.height;

        const handleResizeMove = (e: MouseEvent) => {
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;

            setSize({
                width: Math.max(280, startWidth + deltaX),
                height: Math.max(300, startHeight + deltaY)
            });
        };

        const handleResizeEnd = () => {
            setIsResizing(false);
            document.removeEventListener('mousemove', handleResizeMove);
            document.removeEventListener('mouseup', handleResizeEnd);
        };

        document.addEventListener('mousemove', handleResizeMove);
        document.addEventListener('mouseup', handleResizeEnd);
    };

    return (
        <div
            style={{
                position: 'fixed',
                left: `${position.x}px`,
                top: `${position.y}px`,
                width: `${size.width}px`,
                height: isMinimized ? 'auto' : `${size.height}px`,
                background: 'white',
                border: `2px solid ${borderColor}`,
                borderRadius: '10px',
                zIndex: 1001,
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                display: 'flex',
                flexDirection: 'column',
                userSelect: 'none',
                overflow: 'hidden'
            }}
        >
            {/* Header with drag handle */}
            <div
                onMouseDown={handleMouseDown}
                style={{
                    background: borderColor,
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: '8px 8px 0 0',
                    cursor: isDragging ? 'grabbing' : 'grab',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '14px',
                    fontWeight: 'bold'
                }}
            >
                <span>{title}</span>
                <div className="no-drag" style={{ display: 'flex', gap: '5px' }}>
                    <button
                        onClick={() => setIsMinimized(!isMinimized)}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '12px',
                            padding: '2px 4px'
                        }}
                        title={isMinimized ? 'Expand' : 'Minimize'}
                    >
                        {isMinimized ? '🔼' : '🔽'}
                    </button>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '12px',
                            padding: '2px 4px'
                        }}
                        title="Close"
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* Content */}
            {!isMinimized && (
                <div
                    style={{
                        flex: 1,
                        overflowY: 'auto',
                        overflowX: 'hidden'
                    }}
                >
                    {children}
                </div>
            )}

            {/* Resize handle */}
            {!isMinimized && (
                <div
                    className="no-drag"
                    onMouseDown={handleResize}
                    style={{
                        position: 'absolute',
                        bottom: '0px',
                        right: '0px',
                        width: '20px',
                        height: '20px',
                        background: borderColor,
                        cursor: 'nw-resize',
                        borderRadius: '0 0 8px 0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '12px'
                    }}
                    title="Drag to resize"
                >
                    ↘
                </div>
            )}
        </div>
    );
};

function Main({ appName, aboutText } :any) {
    // PDF Master, MolView and Mode Toggle
    const [currentMode, setCurrentMode] = useState<'cropper' | 'pdfmaster' | 'molview'>('cropper');
    const [showPDFMaster, setShowPDFMaster] = useState(false);
    const [showMolView, setShowMolView] = useState(false);
    
    // Virtual Keyboard
    // Virtual keyboard state variables removed since keyboard is disabled

    // Tab management
    const [tabs, setTabs] = useState<CropTab[]>([{
        id: 'tab-1',
        name: 'Session 1',
        files: [],
        crops: {},
        settings: {
            cropSize: null,
            keepRatio: false,
            resizeOnExport: true,
            lockMovement: true,
            centerCrop: false,
            enableOCR: false
        },
        isActive: true
    }]);
    const [activeTabId, setActiveTabId] = useState('tab-1');

    // Current tab data
    const activeTab = tabs.find(tab => tab.id === activeTabId) || tabs[0];
    const [files, setFiles] = useState<any[]>(activeTab.files);
    const [crops, setCrops] = useState(activeTab.crops);
    const [cropSize, setCropSize] = useState<any>(activeTab.settings.cropSize);
    const [keepRatio, setKeepRatio] = useState(activeTab.settings.keepRatio);
    const [resizeOnExport, setResizeOnExport] = useState(activeTab.settings.resizeOnExport);
    const [lockMovement, setLockMovement] = useState(activeTab.settings.lockMovement);
    const [centerCrop, setCenterCrop] = useState(activeTab.settings.centerCrop);
    const [enableOCR, setEnableOCR] = useState(activeTab.settings.enableOCR);

    // Selection and UI states
    const [selectedFiles, setSelectedFiles] = useState<Set<number>>(new Set());
    const [holdTimer, setHoldTimer] = useState<any>(null);
    const [croppedImages, setCroppedImages] = useState<any>({});
    const [gridView, setGridView] = useState(true);
    const [currentView, setCurrentView] = useState<'crop' | 'history'>('crop');
    const [activeControl, setActiveControl] = useState<string>(''); // 'watermark', 'signature', 'border', or ''
    const [zoomLevel, setZoomLevel] = useState<number>(100); // Default zoom level 100%

    // State for floating images and zoom functionality
    const [floatingImages, setFloatingImages] = useState<{ [key: number]: { position: { x: number, y: number }, size: { width: number, height: number }, visible: boolean } }>({});
    const [zoomedImages, setZoomedImages] = useState<Set<number>>(new Set());

    // Processing and history
    const [processingJobs, setProcessingJobs] = useState<ProcessingJob[]>([]);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [editingTabId, setEditingTabId] = useState<string | null>(null);
    const [editingTabName, setEditingTabName] = useState<string>('');

    // Quality panel states
    const [showQualityPanel, setShowQualityPanel] = useState<boolean>(false);
    const [showAdjustments, setShowAdjustments] = useState<boolean>(false);
    const [showEffects, setShowEffects] = useState<boolean>(false);
    const [showFloatingPreview, setShowFloatingPreview] = useState<boolean>(false);
    const [showPreviewPopup, setShowPreviewPopup] = useState<boolean>(false);
    const [darkMode, setDarkMode] = useState<boolean>(false);
    const [selectedFilter, setSelectedFilter] = useState<any>(null);
    const [adjustmentValues, setAdjustmentValues] = useState<any>(null);
    const [showComparison, setShowComparison] = useState<boolean>(false);
    const [watermarkText, setWatermarkText] = useState<string>('WATERMARK');
    const [signatureText, setSignatureText] = useState<string>('');
    const [enableWatermark, setEnableWatermark] = useState<boolean>(false);
    const [enableBorder, setEnableBorder] = useState<boolean>(false);
    const [enableSignature, setEnableSignature] = useState<boolean>(false);
    const [rearrangeMode, setRearrangeMode] = useState<boolean>(false);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    // Border states
    const [borderWidth, setBorderWidth] = useState<number>(10);
    const [borderColor, setBorderColor] = useState<string>('#000000');
    const [borderStyle, setBorderStyle] = useState<string>('solid');
    const [borderRadius, setBorderRadius] = useState<number>(0);
    const [borderGradient, setBorderGradient] = useState<string>('');
    const [borderShadow, setBorderShadow] = useState<boolean>(false);
    const [showAdvancedBorderEditor, setShowAdvancedBorderEditor] = useState<boolean>(false);
                    const [borderPattern, setBorderPattern] = useState<string>('');
                    const [borderAnimation, setBorderAnimation] = useState<boolean>(false);

    // Text styling states for watermark
    const [watermarkFontSize, setWatermarkFontSize] = useState<number>(24);
    const [watermarkFontFamily, setWatermarkFontFamily] = useState<string>('Arial');
    const [watermarkIsBold, setWatermarkIsBold] = useState<boolean>(false);
    const [watermarkIsItalic, setWatermarkIsItalic] = useState<boolean>(false);
    const [watermarkTextAlign, setWatermarkTextAlign] = useState<string>('center');
    const [watermarkTextColor, setWatermarkTextColor] = useState<string>('#FFFFFF');

    // Text styling states for signature
    const [signatureFontSize, setSignatureFontSize] = useState<number>(18);
    const [signatureFontFamily, setSignatureFontFamily] = useState<string>('cursive');
    const [signatureIsBold, setSignatureIsBold] = useState<boolean>(false);
    const [signatureIsItalic, setSignatureIsItalic] = useState<boolean>(true);
    const [signatureTextAlign, setSignatureTextAlign] = useState<string>('center');
    const [signatureTextColor, setSignatureTextColor] = useState<string>('#000000');

    // Text editor popup states
    const [showWatermarkEditor, setShowWatermarkEditor] = useState<boolean>(false);
    const [showSignatureEditor, setShowSignatureEditor] = useState<boolean>(false);

    // Multiple Watermarks and Signatures with individual controls
    const [watermarks, setWatermarks] = useState<Array<{
        id: string;
        text: string;
        image: string;
        opacity: number;
        position: { x: number; y: number };
        size: { width: number; height: number };
        rotation: number;
        fontSize: number;
        fontFamily: string;
        isBold: boolean;
        isItalic: boolean;
        textAlign: string;
        textColor: string;
        isMovable: boolean;
        history: Array<any>;
    }>>([{
        id: 'watermark-1',
        text: 'WATERMARK',
        image: '',
        opacity: 70,
        position: { x: 80, y: 90 },
        size: { width: 200, height: 50 },
        rotation: 0,
        fontSize: 24,
        fontFamily: 'Arial, sans-serif',
        isBold: false,
        isItalic: false,
        textAlign: 'center',
        textColor: '#FFFFFF',
        isMovable: false,
        history: []
    }]);

    const [signatures, setSignatures] = useState<Array<{
        id: string;
        text: string;
        image: string;
        opacity: number;
        position: { x: number; y: number };
        size: { width: number; height: number };
        rotation: number;
        fontSize: number;
        fontFamily: string;
        isBold: boolean;
        isItalic: boolean;
        textAlign: string;
        textColor: string;
        isMovable: boolean;
        history: Array<any>;
    }>>([{
        id: 'signature-1',
        text: '',
        image: '',
        opacity: 80,
        position: { x: 5, y: 95 },
        size: { width: 150, height: 40 },
        rotation: 0,
        fontSize: 18,
        fontFamily: 'cursive',
        isBold: false,
        isItalic: true,
        textAlign: 'center',
        textColor: '#000000',
        isMovable: false,
        history: []
    }]);

    const [activeElement, setActiveElement] = useState<{ type: 'watermark' | 'signature' | null; id: string | null }>({ type: null, id: null });
    const [selectedElementForEdit, setSelectedElementForEdit] = useState<{ type: 'watermark' | 'signature' | null; id: string | null }>({ type: null, id: null });
    
    // Control panel state
    const [showControlPanel, setShowControlPanel] = useState<boolean>(false);
    const [controlPanelPosition, setControlPanelPosition] = useState({ x: 50, y: 50 });
    const [selectedElement, setSelectedElement] = useState<{ type: 'watermark' | 'signature' | null; id: string | null }>({ type: null, id: null });
    const [isRotating, setIsRotating] = useState<boolean>(false);

    // Backward compatibility states
    const [watermarkOpacity, setWatermarkOpacity] = useState<number>(70);
    const [signatureOpacity, setSignatureOpacity] = useState<number>(80);
    const [watermarkPosition, setWatermarkPosition] = useState({ x: 80, y: 90 });
    const [signaturePosition, setSignaturePosition] = useState({ x: 5, y: 95 });
    const [watermarkSize, setWatermarkSize] = useState({ width: 200, height: 50 });
    const [signatureSize, setSignatureSize] = useState({ width: 150, height: 40 });
    const [watermarkImage, setWatermarkImage] = useState<string>('');
    const [signatureImage, setSignatureImage] = useState<string>('');
    const [borderImage, setBorderImage] = useState<string>('');
    const [watermarkRotation, setWatermarkRotation] = useState<number>(0);
    const [signatureRotation, setSignatureRotation] = useState<number>(0);

    // Preview states
    const [previewImage, setPreviewImage] = useState<string>('');
    const [qualityPreviewImage, setQualityPreviewImage] = useState<string>('');
    const [originalCroppedImages, setOriginalCroppedImages] = useState<any>({});
    const [previewSize, setPreviewSize] = useState({ width: 300, height: 200 });
    const [previewPosition, setPreviewPosition] = useState({ x: 50, y: 50 });
    const [isResizing, setIsResizing] = useState<boolean>(false);
    const [currentPreviewIndex, setCurrentPreviewIndex] = useState<number>(0);
    const [previewHistory, setPreviewHistory] = useState<string[]>([]);
    const [previewHistoryIndex, setPreviewHistoryIndex] = useState<number>(0);
    const [qualityHistory, setQualityHistory] = useState<Array<{
        timestamp: number;
        selectedFilter: any;
        adjustmentValues: any;
        watermarks: any[];
        signatures: any[];
        enableWatermark: boolean;
        enableSignature: boolean;
        enableBorder: boolean;
        borderWidth: number;
        borderColor: string;
        previewImage: string;
    }>>([]);
    const [qualityHistoryIndex, setQualityHistoryIndex] = useState<number>(-1);

    const inputRef = useRef<HTMLInputElement>(null);
    const folderInputRef = useRef<HTMLInputElement>(null);
    const globalCropTimeout = useRef<any>(null);

    // Cleanup timeouts on unmount
    useEffect(() => {
        return () => {
            if (globalCropTimeout.current) {
                clearTimeout(globalCropTimeout.current);
            }
        };
    }, []);

    // Update active tab when switching
    useEffect(() => {
        const tab = tabs.find(t => t.id === activeTabId) || tabs[0];
        if (tab) {
            setFiles(tab.files);
            setCrops(tab.crops);
            setCropSize(tab.settings.cropSize);
            setKeepRatio(tab.settings.keepRatio);
            setResizeOnExport(tab.settings.resizeOnExport);
            setLockMovement(tab.settings.lockMovement);
            setCenterCrop(tab.settings.centerCrop);
            setEnableOCR(tab.settings.enableOCR);
        }
    }, [activeTabId, tabs]);

    // Save current tab state
    const saveCurrentTabState = () => {
        setTabs(prev => prev.map(tab =>
            tab.id === activeTabId
                ? {
                    ...tab,
                    files,
                    crops,
                    settings: {
                        cropSize,
                        keepRatio,
                        resizeOnExport,
                        lockMovement,
                        centerCrop,
                        enableOCR
                    }
                }
                : tab
        ));
    };

    // Auto-save tab state when values change (with debouncing to prevent excessive updates)
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            saveCurrentTabState();
        }, 100); // Debounce by 100ms

        return () => clearTimeout(timeoutId);
    }, [files, crops, cropSize, keepRatio, resizeOnExport, lockMovement, centerCrop, enableOCR]);

    const addNewTab = () => {
        const newTabId = `tab-${Date.now()}`;
        const newTab: CropTab = {
            id: newTabId,
            name: `Crop Session ${tabs.length + 1}`,
            files: [],
            crops: {},
            settings: {
                cropSize: null,
                keepRatio: true,
                resizeOnExport: true,
                lockMovement: true,
                centerCrop: false,
                enableOCR: false
            },
            isActive: true
        };

        setTabs(prev => [...prev.map(t => ({...t, isActive: false})), newTab]);
        setActiveTabId(newTabId);
    };

    const closeTab = (tabId: string) => {
        if (tabs.length === 1) return; // Don't close last tab

        setTabs(prev => {
            const filtered = prev.filter(t => t.id !== tabId);
            if (tabId === activeTabId && filtered.length > 0) {
                setActiveTabId(filtered[0].id);
            }
            return filtered;
        });
    };

    const startEditingTab = (tabId: string, currentName: string) => {
        setEditingTabId(tabId);
        setEditingTabName(currentName);
    };

    const saveTabName = () => {
        if (editingTabId && editingTabName.trim()) {
            setTabs(prev => prev.map(tab =>
                tab.id === editingTabId
                    ? { ...tab, name: editingTabName.trim() }
                    : tab
            ));
        }
        setEditingTabId(null);
        setEditingTabName('');
    };

    const cancelEditingTab = () => {
        setEditingTabId(null);
        setEditingTabName('');
    };

    const onSetCropped = (index: number, croppedImage: any) => {
        setCroppedImages((prev: any) => ({ ...prev, [index]: croppedImage }));
    };

    const onSetFiles = (input: Array<any>) => {
        const allFiles = input ? Object.values(input) : [];
        // Filter only image files
        const imageFiles = allFiles.filter((file: File) => file.type.startsWith('image/'));
        if (imageFiles.length === 0) return;

        // Remove duplicates based on file name and size
        const uniqueFiles = imageFiles.filter((newFile: File) => {
            return !files.some((existingFile: File) =>
                existingFile.name === newFile.name &&
                existingFile.size === newFile.size &&
                existingFile.lastModified === newFile.lastModified
            );
        });

        console.log("set new files", { input, files, newFiles: uniqueFiles, filtered: imageFiles.length - uniqueFiles.length });

        if (uniqueFiles.length > 0) {
            setFiles(prev => [...prev, ...uniqueFiles]);
        }
    };

    const onRemoveImage = (index: number) => {
        console.log("remove", { index, files, croppedImages });
        setFiles(prev => prev.filter((_, i) => i !== index));
        setSelectedFiles(prev => {
            const newSet = new Set(prev);
            newSet.delete(index);
            return newSet;
        });
        // Also remove crop data associated with the removed image
        setCrops((prevCrops: any) => {
            const newCrops = { ...prevCrops };
            delete newCrops[index];
            return newCrops;
        });
        setCroppedImages((prevCroppedImages: any) => {
            const newCroppedImages = { ...prevCroppedImages };
            delete newCroppedImages[index];
            return newCroppedImages;
        });
    };

    // Selection handlers
    const toggleFileSelection = (index: number) => {
        setSelectedFiles(prev => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    };

    const handleMouseDown = (index: number) => {
        const timer = setTimeout(() => {
            toggleFileSelection(index);
        }, 1000); // 1 second hold
        setHoldTimer(timer);
    };

    const handleMouseUp = () => {
        if (holdTimer) {
            clearTimeout(holdTimer);
            setHoldTimer(null);
        }
    };

    const selectAllFiles = () => {
        setSelectedFiles(new Set(files.map((_, index) => index)));
    };

    const clearSelection = () => {
        setSelectedFiles(new Set());
    };

    useEffect(() => {
        if (files.length === 0 && inputRef?.current?.value) {
            inputRef.current.value = "";
        }
    }, [files]);

    const onSetAllToCrop = () => {
        setCrops((prevCrops: any) => {
            const newCrops: any = {};
            Object.keys(prevCrops).forEach(key => {
                newCrops[key] = { ...prevCrops[key], ...cropSize };
            });
            return newCrops;
        });
    };

    const onGlobalCropChange = (masterIndex: number, newCrop: any) => {
        if (!lockMovement) return;

        // Debounce rapid crop changes to prevent UI shaking
        const debouncedUpdate = () => {
            setCrops((prevCrops: any) => {
                const newCrops = { ...prevCrops };
                Object.keys(newCrops).forEach(key => {
                    if (key !== masterIndex.toString()) {
                        newCrops[key] = {
                            ...newCrops[key],
                            x: newCrop.x,
                            y: newCrop.y,
                            width: newCrop.width,
                            height: newCrop.height
                        };
                    }
                });
                return newCrops;
            });
        };

        // Clear any existing timeout and set a new one
        if (globalCropTimeout.current) {
            clearTimeout(globalCropTimeout.current);
        }
        globalCropTimeout.current = setTimeout(debouncedUpdate, 50);
    };

    const onCenterAllCrops = () => {
        setCrops((prevCrops: any) => {
            const newCrops = { ...prevCrops };
            Object.keys(newCrops).forEach(key => {
                const crop = newCrops[key];
                if (crop && crop.image) {
                    const centerX = (crop.image.naturalWidth - (crop.width || 100)) / 2;
                    const centerY = (crop.image.naturalHeight - (crop.height || 100)) / 2;
                    newCrops[key] = {
                        ...crop,
                        x: Math.max(0, centerX),
                        y: Math.max(0, centerY)
                    };
                }
            });
            return newCrops;
        });
    };

    useEffect(() => {
        if (centerCrop) {
            onCenterAllCrops();
        }
    }, [centerCrop]);

    // Quality panel functions
    const applyImageTransformations = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
        // Apply filter effects
        if (selectedFilter) {
            ctx.filter = selectedFilter.cssFilter;
        }

        // Apply adjustments if available
        if (adjustmentValues) {
            const filters = [];

            if (adjustmentValues.brightness !== 0) {
                filters.push(`brightness(${1 + adjustmentValues.brightness / 100})`);
            }
            if (adjustmentValues.contrast !== 0) {
                filters.push(`contrast(${1 + adjustmentValues.contrast / 100})`);
            }
            if (adjustmentValues.saturation !== 0) {
                filters.push(`saturate(${1 + adjustmentValues.saturation / 100})`);
            }
            if (adjustmentValues.hue !== 0) {
                filters.push(`hue-rotate(${adjustmentValues.hue}deg)`);
            }
            if (adjustmentValues.blur !== 0) {
                filters.push(`blur(${adjustmentValues.blur}px)`);
            }
            if (adjustmentValues.sharpen !== 0) {
                filters.push(`contrast(${1 + adjustmentValues.sharpen / 50})`);
            }

            if (filters.length > 0) {
                ctx.filter = (ctx.filter === 'none' ? '' : ctx.filter + ' ') + filters.join(' ');
            }
        }
    };

    // Watermark, Border, Signature apply functions
    const addWatermark = async (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
        if (!enableWatermark) return;

        // Apply all watermarks
        for (const watermark of watermarks) {
            if (!watermark.text?.trim() && !watermark.image) continue;

            const centerX = (watermark.position.x / 100) * canvas.width;
            const centerY = (watermark.position.y / 100) * canvas.height;

            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate((watermark.rotation * Math.PI) / 180);
            ctx.globalAlpha = watermark.opacity / 100;

            if (watermark.image) {
                try {
                    const img = await loadImageAsync(watermark.image);
                    ctx.drawImage(img, -watermark.size.width / 2, -watermark.size.height / 2, watermark.size.width, watermark.size.height);
                } catch (error) {
                    console.error("Failed to load watermark image:", error);
                }
            } else if (watermark.text?.trim()) {
                const scaledFontSize = Math.max(canvas.width / 800 * watermark.fontSize, 12);
                const fontWeight = watermark.isBold ? 'bold' : 'normal';
                const fontStyle = watermark.isItalic ? 'italic' : 'normal';

                ctx.font = `${fontStyle} ${fontWeight} ${scaledFontSize}px ${watermark.fontFamily}`;
                ctx.fillStyle = watermark.textColor;
                ctx.strokeStyle = watermark.textColor === '#FFFFFF' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)';
                ctx.lineWidth = 1;
                ctx.textAlign = watermark.textAlign as CanvasTextAlign;
                ctx.textBaseline = 'middle';

                ctx.shadowColor = watermark.textColor === '#FFFFFF' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)';
                ctx.shadowBlur = 3;
                ctx.shadowOffsetX = 1;
                ctx.shadowOffsetY = 1;

                ctx.strokeText(watermark.text, 0, 0);
                ctx.fillText(watermark.text, 0, 0);
            }
            ctx.restore();
        }

        // Backward compatibility - apply legacy watermark if exists
        if ((watermarkText?.trim() || watermarkImage) && watermarks.length === 1) {
            const centerX = (watermarkPosition.x / 100) * canvas.width;
            const centerY = (watermarkPosition.y / 100) * canvas.height;

            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate((watermarkRotation * Math.PI) / 180);
            ctx.globalAlpha = watermarkOpacity / 100;

            if (watermarkImage) {
                try {
                    const img = await loadImageAsync(watermarkImage);
                    ctx.drawImage(img, -watermarkSize.width / 2, -watermarkSize.height / 2, watermarkSize.width, watermarkSize.height);
                } catch (error) {
                    console.error("Failed to load legacy watermark image:", error);
                }
            } else if (watermarkText?.trim()) {
                // Enhanced font scaling for better visibility on large canvases  
                const baseFontSize = watermarkFontSize * 1.5; // Increase base font size multiplier
                const scaledFontSize = Math.max(canvas.width / 600 * baseFontSize, watermarkFontSize);
                const fontWeight = watermarkIsBold ? 'bold' : 'normal';
                const fontStyle = watermarkIsItalic ? 'italic' : 'normal';

                ctx.font = `${fontStyle} ${fontWeight} ${scaledFontSize}px ${watermarkFontFamily}`;
                ctx.fillStyle = watermarkTextColor;
                ctx.strokeStyle = watermarkTextColor === '#FFFFFF' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)';
                ctx.lineWidth = 1;
                ctx.textAlign = watermarkTextAlign as CanvasTextAlign;
                ctx.textBaseline = 'middle';

                ctx.shadowColor = watermarkTextColor === '#FFFFFF' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)';
                ctx.shadowBlur = 3;
                ctx.shadowOffsetX = 1;
                ctx.shadowOffsetY = 1;

                ctx.strokeText(watermarkText, 0, 0);
                ctx.fillText(watermarkText, 0, 0);
            }
            ctx.restore();
        }
    };

    const addBorder = async (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
        if (!enableBorder || borderWidth <= 0) return;

        ctx.save();
        ctx.lineWidth = borderWidth;
        
        const x = borderWidth / 2;
        const y = borderWidth / 2;
        const width = canvas.width - borderWidth;
        const height = canvas.height - borderWidth;
        const radius = borderRadius || 0;

        if (borderImage) {
            try {
                const img = await loadImageAsync(borderImage);
                const pattern = ctx.createPattern(img, 'repeat');
                if (pattern) {
                    ctx.strokeStyle = pattern;
                    if (radius > 0) {
                        drawRoundedRect(ctx, x, y, width, height, radius);
                        ctx.stroke();
                    } else {
                        ctx.strokeRect(x, y, width, height);
                    }
                }
            } catch (error) {
                console.error("Failed to load border image:", error);
            }
        } else {
            ctx.strokeStyle = borderColor;
            
            // Apply border style effects
            if (borderStyle === 'dashed') {
                ctx.setLineDash([borderWidth * 2, borderWidth]);
            } else if (borderStyle === 'dotted') {
                ctx.setLineDash([borderWidth, borderWidth]);
            } else if (borderStyle === 'double') {
                // Draw double border
                ctx.lineWidth = borderWidth / 3;
                if (radius > 0) {
                    drawRoundedRect(ctx, x, y, width, height, radius);
                    ctx.stroke();
                    drawRoundedRect(ctx, x + borderWidth * 0.66, y + borderWidth * 0.66, 
                                  width - borderWidth * 1.33, height - borderWidth * 1.33, 
                                  Math.max(0, radius - borderWidth * 0.66));
                    ctx.stroke();
                } else {
                    ctx.strokeRect(x, y, width, height);
                    ctx.strokeRect(x + borderWidth * 0.66, y + borderWidth * 0.66, 
                                 width - borderWidth * 1.33, height - borderWidth * 1.33);
                }
                ctx.restore();
                return;
            }
            
            if (radius > 0) {
                drawRoundedRect(ctx, x, y, width, height, radius);
                ctx.stroke();
            } else {
                ctx.strokeRect(x, y, width, height);
            }
            
            // Reset line dash for other elements
            ctx.setLineDash([]);
        }
        ctx.restore();
    };

    const addSignature = async (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
        if (!enableSignature) return;

        // Apply all signatures
        for (const signature of signatures) {
            if (!signature.text?.trim() && !signature.image) continue;

            const centerX = (signature.position.x / 100) * canvas.width;
            const centerY = (signature.position.y / 100) * canvas.height;

            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate((signature.rotation * Math.PI) / 180);
            ctx.globalAlpha = signature.opacity / 100;

            if (signature.image) {
                try {
                    const img = await loadImageAsync(signature.image);
                    ctx.drawImage(img, -signature.size.width / 2, -signature.size.height / 2, signature.size.width, signature.size.height);
                } catch (error) {
                    console.error("Failed to load signature image:", error);
                }
            } else if (signature.text?.trim()) {
                // Enhanced font scaling for better visibility on large canvases
                const baseFontSize = signature.fontSize * 1.5; // Increase base font size multiplier
                const scaledFontSize = Math.max(canvas.width / 600 * baseFontSize, signature.fontSize);
                const fontWeight = signature.isBold ? 'bold' : 'normal';
                const fontStyle = signature.isItalic ? 'italic' : 'normal';

                ctx.font = `${fontStyle} ${fontWeight} ${scaledFontSize}px ${signature.fontFamily}`;
                ctx.fillStyle = signature.textColor;
                ctx.strokeStyle = signature.textColor === '#000000' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)';
                ctx.lineWidth = 0.5;
                ctx.textAlign = signature.textAlign as CanvasTextAlign;
                ctx.textBaseline = 'middle';

                ctx.shadowColor = signature.textColor === '#000000' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)';
                ctx.shadowBlur = 2;
                ctx.shadowOffsetX = 0.5;
                ctx.shadowOffsetY = 0.5;

                ctx.strokeText(signature.text, 0, 0);
                ctx.fillText(signature.text, 0, 0);
            }
            ctx.restore();
        }

        // Backward compatibility - apply legacy signature if exists
        if ((signatureText?.trim() || signatureImage) && signatures.length === 1) {
            const centerX = (signaturePosition.x / 100) * canvas.width;
            const centerY = (signaturePosition.y / 100) * canvas.height;

            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate((signatureRotation * Math.PI) / 180);
            ctx.globalAlpha = signatureOpacity / 100;

            if (signatureImage) {
                try {
                    const img = await loadImageAsync(signatureImage);
                    ctx.drawImage(img, -signatureSize.width / 2, -signatureSize.height / 2, signatureSize.width, signatureSize.height);
                } catch (error) {
                    console.error("Failed to load legacy signature image:", error);
                }
            } else if (signatureText?.trim()) {
                // Enhanced font scaling for better visibility on large canvases
                const baseFontSize = signatureFontSize * 1.5; // Increase base font size multiplier
                const scaledFontSize = Math.max(canvas.width / 600 * baseFontSize, signatureFontSize);
                const fontWeight = signatureIsBold ? 'bold' : 'normal';
                const fontStyle = signatureIsItalic ? 'italic' : 'normal';

                ctx.font = `${fontStyle} ${fontWeight} ${scaledFontSize}px ${signatureFontFamily}`;
                ctx.fillStyle = signatureTextColor;
                ctx.strokeStyle = signatureTextColor === '#000000' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)';
                ctx.lineWidth = 0.5;
                ctx.textAlign = signatureTextAlign as CanvasTextAlign;
                ctx.textBaseline = 'middle';

                ctx.shadowColor = signatureTextColor === '#000000' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)';
                ctx.shadowBlur = 2;
                ctx.shadowOffsetX = 0.5;
                ctx.shadowOffsetY = 0.5;

                ctx.strokeText(signatureText, 0, 0);
                ctx.fillText(signatureText, 0, 0);
            }
            ctx.restore();
        }
    };

    // Add new watermark - always center initially
    const addNewWatermark = () => {
        const newWatermark = {
            id: `watermark-${Date.now()}`,
            text: 'NEW WATERMARK',
            image: '',
            opacity: 70,
            position: { x: 50, y: 50 }, // Always center
            size: { width: 200, height: 50 },
            rotation: 0,
            fontSize: 24,
            fontFamily: 'Arial, sans-serif',
            isBold: false,
            isItalic: false,
            textAlign: 'center',
            textColor: '#FFFFFF',
            isMovable: false,
            history: []
        };

        saveQualityState(); // Save state before adding
        setWatermarks(prev => [...prev, newWatermark]);
        setEnableWatermark(true);
        setSelectedElementForEdit({ type: 'watermark', id: newWatermark.id });
        setShowWatermarkEditor(true);
    };

    // Add new signature - always center initially
    const addNewSignature = () => {
        const newSignature = {
            id: `signature-${Date.now()}`,
            text: 'New Signature',
            image: '',
            opacity: 80,
            position: { x: 50, y: 50 }, // Always center
            size: { width: 150, height: 40 },
            rotation: 0,
            fontSize: 18,
            fontFamily: 'cursive',
            isBold: false,
            isItalic: true,
            textAlign: 'center',
            textColor: '#000000',
            isMovable: false,
            history: []
        };

        saveQualityState(); // Save state before adding
        setSignatures(prev => [...prev, newSignature]);
        setEnableSignature(true);
        setSelectedElementForEdit({ type: 'signature', id: newSignature.id });
        setShowSignatureEditor(true);
    };

    // Delete specific watermark
    const deleteWatermark = (id: string) => {
        saveQualityState(); // Save state before deleting
        setWatermarks(prev => prev.filter(w => w.id !== id));
        if (watermarks.length <= 1) {
            setEnableWatermark(false);
        }
        setActiveElement({ type: null, id: null });
    };

    // Delete specific signature
    const deleteSignature = (id: string) => {
        saveQualityState(); // Save state before deleting
        setSignatures(prev => prev.filter(s => s.id !== id));
        if (signatures.length <= 1) {
            setEnableSignature(false);
        }
        setActiveElement({ type: null, id: null });
    };

    // Update watermark
    const updateWatermark = (id: string, updates: Partial<typeof watermarks[0]>) => {
        setWatermarks(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
    };

    // Update signature
    const updateSignature = (id: string, updates: Partial<typeof signatures[0]>) => {
        setSignatures(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    };

    // Save element state to history
    const saveElementHistory = (type: 'watermark' | 'signature', id: string) => {
        if (type === 'watermark') {
            const element = watermarks.find(w => w.id === id);
            if (element) {
                const newHistory = [...element.history, { ...element }].slice(-10); // Keep last 10 states
                updateWatermark(id, { history: newHistory });
            }
        } else {
            const element = signatures.find(s => s.id === id);
            if (element) {
                const newHistory = [...element.history, { ...element }].slice(-10); // Keep last 10 states
                updateSignature(id, { history: newHistory });
            }
        }
    };

    // Toggle element movability
    const toggleElementMove = (type: 'watermark' | 'signature', id: string) => {
        if (type === 'watermark') {
            const element = watermarks.find(w => w.id === id);
            if (element) {
                saveElementHistory(type, id);
                updateWatermark(id, { isMovable: !element.isMovable });
            }
        } else {
            const element = signatures.find(s => s.id === id);
            if (element) {
                saveElementHistory(type, id);
                updateSignature(id, { isMovable: !element.isMovable });
            }
        }
    };

    // Resize element
    const resizeElement = (type: 'watermark' | 'signature', id: string, scale: number) => {
        if (type === 'watermark') {
            const element = watermarks.find(w => w.id === id);
            if (element) {
                const newSize = {
                    width: Math.max(50, element.size.width * (scale / 100)),
                    height: Math.max(30, element.size.height * (scale / 100))
                };
                updateWatermark(id, { size: newSize });
            }
        } else {
            const element = signatures.find(s => s.id === id);
            if (element) {
                const newSize = {
                    width: Math.max(50, element.size.width * (scale / 100)),
                    height: Math.max(30, element.size.height * (scale / 100))
                };
                updateSignature(id, { size: newSize });
            }
        }
    };

    // Rotate element
    const rotateElement = (type: 'watermark' | 'signature', id: string, angle: number) => {
        if (type === 'watermark') {
            updateWatermark(id, { rotation: angle });
        } else {
            updateSignature(id, { rotation: angle });
        }
    };

    // Delete element
    const deleteElement = (type: 'watermark' | 'signature', id: string) => {
        if (window.confirm(`Delete this ${type}?`)) {
            if (type === 'watermark') {
                setWatermarks(prev => prev.filter(w => w.id !== id));
                if (watermarks.length <= 1) {
                    setEnableWatermark(false);
                }
            } else {
                setSignatures(prev => prev.filter(s => s.id !== id));
                if (signatures.length <= 1) {
                    setEnableSignature(false);
                }
            }
            setShowControlPanel(false);
            setSelectedElement({ type: null, id: null });
        }
    };

    // Undo element change
    const undoElementChange = (type: 'watermark' | 'signature', id: string) => {
        if (type === 'watermark') {
            const element = watermarks.find(w => w.id === id);
            if (element && element.history.length > 0) {
                const previousState = element.history[element.history.length - 1];
                const newHistory = element.history.slice(0, -1);
                updateWatermark(id, { ...previousState, history: newHistory });
            }
        } else {
            const element = signatures.find(s => s.id === id);
            if (element && element.history.length > 0) {
                const previousState = element.history[element.history.length - 1];
                const newHistory = element.history.slice(0, -1);
                updateSignature(id, { ...previousState, history: newHistory });
            }
        }
    };

    // Open element editor
    const openElementEditor = (type: 'watermark' | 'signature', id: string) => {
        setSelectedElementForEdit({ type, id });
        if (type === 'watermark') {
            setShowWatermarkEditor(true);
        } else {
            setShowSignatureEditor(true);
        }
    };

    // Handle element click
    const handleElementClick = (type: 'watermark' | 'signature', id: string, event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        
        // Save element state before making changes
        saveElementHistory(type, id);
        
        setSelectedElement({ type, id });
        setActiveElement({ type, id });
        setShowControlPanel(true);
        
        // Position control panel near the clicked element
        const rect = event.currentTarget.getBoundingClientRect();
        setControlPanelPosition({
            x: Math.min(window.innerWidth - 320, rect.right + 10),
            y: Math.max(50, rect.top)
        });
    };

    // Exported functions for QualityPanel
    const handleAddWatermark = () => {
        if (watermarks.length === 0) {
            addNewWatermark();
        } else {
            const firstWatermark = watermarks[0];
            setSelectedElementForEdit({ type: 'watermark', id: firstWatermark.id });
            setShowWatermarkEditor(true);
        }
    };

    const handleAddBorder = () => {
        const widthInput = prompt('Enter border width (pixels):', borderWidth.toString());
        const color = prompt('Enter border color (hex or name, e.g., #FF0000 or red):', borderColor);
        if (widthInput !== null && !isNaN(parseInt(widthInput))) {
            setBorderWidth(parseInt(widthInput));
            setEnableBorder(true); // Enable border if width is provided
        }
        if (color !== null && color.trim() !== '') {
            setBorderColor(color.trim());
            setEnableBorder(true); // Enable border if color is provided
        }
    };

    const handleAddSignature = () => {
        const text = prompt('Enter signature text:', signatureText);
        if (text !== null) {
            setSignatureText(text);
            setEnableSignature(true); // Enable signature if text is provided

            // Show text editor popup
            setShowSignatureEditor(true);
        }
    };

    // Import image for watermark
    const importWatermarkImage = (watermarkId?: string) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e: Event) => {
            const target = e.target as HTMLInputElement;
            const file = target.files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const result = e.target?.result as string;
                    if (watermarkId) {
                        // Update specific watermark - ensure it's centered with control point
                        updateWatermark(watermarkId, { 
                            image: result, 
                            text: '',
                            position: { x: 50, y: 50 } // Always center when importing image
                        });
                    } else {
                        // If no watermarks exist, create new one centered
                        if (watermarks.length === 0) {
                            const newWatermark = {
                                id: `watermark-${Date.now()}`,
                                text: '',
                                image: result,
                                opacity: 70,
                                position: { x: 50, y: 50 }, // Center position
                                size: { width: 200, height: 50 },
                                rotation: 0,
                                fontSize: 24,
                                fontFamily: 'Arial, sans-serif',
                                isBold: false,
                                isItalic: false,
                                textAlign: 'center',
                                textColor: '#FFFFFF',
                                isMovable: false,
                                history: []
                            };
                            setWatermarks([newWatermark]);
                        } else {
                            // Update first watermark
                            updateWatermark(watermarks[0].id, { 
                                image: result, 
                                text: '',
                                position: { x: 50, y: 50 }
                            });
                        }
                        setWatermarkImage(result);
                    }
                    setEnableWatermark(true);
                    alert('Watermark image imported successfully! Click the blue control point to adjust settings.');
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    };

    // Import image for signature
    const importSignatureImage = (signatureId?: string) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e: Event) => {
            const target = e.target as HTMLInputElement;
            const file = target.files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const result = e.target?.result as string;
                    if (signatureId) {
                        // Update specific signature - ensure it's centered with control point
                        updateSignature(signatureId, { 
                            image: result, 
                            text: '',
                            position: { x: 50, y: 50 } // Always center when importing image
                        });
                    } else {
                        // If no signatures exist, create new one centered
                        if (signatures.length === 0) {
                            const newSignature = {
                                id: `signature-${Date.now()}`,
                                text: '',
                                image: result,
                                opacity: 80,
                                position: { x: 50, y: 50 }, // Center position
                                size: { width: 150, height: 40 },
                                rotation: 0,
                                fontSize: 18,
                                fontFamily: 'cursive',
                                isBold: false,
                                isItalic: true,
                                textAlign: 'center',
                                textColor: '#000000',
                                isMovable: false,
                                history: []
                            };
                            setSignatures([newSignature]);
                        } else {
                            // Update first signature
                            updateSignature(signatures[0].id, { 
                                image: result, 
                                text: '',
                                position: { x: 50, y: 50 }
                            });
                        }
                        setSignatureImage(result);
                    }
                    setEnableSignature(true);
                    alert('Signature image imported successfully! Click the purple control point to adjust settings.');
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    };

    // Import functions for watermark, signature, and border images
    const handleImportWatermark = () => {
        importWatermarkImage();
    };

    const handleImportSignature = () => {
        importSignatureImage();
    };

    const handleImportBorder = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e: Event) => {
            const target = e.target as HTMLInputElement;
            const file = target.files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const result = e.target?.result as string;
                    setBorderImage(result);
                    setEnableBorder(true);
                    setBorderWidth(10); // Set default border width
                    setBorderColor('#000000'); // Set default border color
                    alert('Border pattern imported! It will be used as a repeating pattern for the border. Use the Advanced Border Editor to customize.');
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    };

    const handleShowPreview = async () => {
        if (files.length > 0) {
            // Generate a preview with the first image
            const firstImageFile = files[0];
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const img = new Image();
            img.onload = async () => {
                canvas.width = img.width;
                canvas.height = img.height;

                // Apply current effects
                let filterString = '';
                if (selectedFilter) {
                    filterString += selectedFilter.cssFilter;
                }
                if (adjustmentValues) {
                    const filters = [];
                    if (adjustmentValues.brightness !== 0) {
                        filters.push(`brightness(${1 + adjustmentValues.brightness / 100})`);
                    }
                    if (adjustmentValues.contrast !== 0) {
                        filters.push(`contrast(${1 + adjustmentValues.contrast / 100})`);
                    }
                    if (adjustmentValues.saturation !== 0) {
                        filters.push(`saturate(${1 + adjustmentValues.saturation / 100})`);
                    }
                    if (adjustmentValues.hue !== 0) {
                        filters.push(`hue-rotate(${adjustmentValues.hue}deg)`);
                    }
                    if (adjustmentValues.blur !== 0) {
                        filters.push(`blur(${adjustmentValues.blur}px)`);
                    }
                    if (adjustmentValues.sharpen !== 0) {
                        filters.push(`contrast(${1 + adjustmentValues.sharpen / 50})`);
                    }
                    filterString += (filterString ? ' ' : '') + filters.join(' ');
                }

                ctx.filter = filterString || 'none';
                ctx.drawImage(img, 0, 0);

                // Reset filter for overlays
                ctx.filter = 'none';

                // Add watermark
                await addWatermark(canvas, ctx);

                // Add border
                await addBorder(canvas, ctx);

                // Add signature
                await addSignature(canvas, ctx);

                setPreviewImage(canvas.toDataURL());
                setShowPreviewPopup(true);
            };
            img.onerror = () => {
                console.error("Failed to load image for preview");
            };
            img.src = URL.createObjectURL(firstImageFile);
        } else {
            alert('Please add some images first to preview effects!');
        }
    };

    const generateQualityPreview = async () => {
    // Use the first cropped image if available, otherwise load original or sample
    const firstCropKey = Object.keys(crops).find(key => crops[parseInt(key)] && crops[parseInt(key)].width && crops[parseInt(key)].height);

    if (firstCropKey) {
        // Generate cropped image for preview with effects applied
        const crop = crops[parseInt(firstCropKey)];
        try {
            const enhancedImage = await generateEnhancedCroppedImage(crop, parseInt(firstCropKey));
            if (enhancedImage && enhancedImage.dataUrl) {
                setPreviewImage(enhancedImage.dataUrl);
                setQualityPreviewImage(enhancedImage.dataUrl);
                setCurrentPreviewIndex(parseInt(firstCropKey));
                setPreviewHistory([enhancedImage.dataUrl]);
                setPreviewHistoryIndex(0);
            } else {
                console.warn('Failed to generate cropped image for preview');
                generateFallbackPreview();
            }
        } catch (error) {
            console.error('Error generating quality preview:', error);
            generateFallbackPreview();
        }
    } else if (files.length > 0) {
        // If not cropped, load the first original file directly
        const file = files[0];
        const imgURL = URL.createObjectURL(file);
        setQualityPreviewImage(imgURL);
        setPreviewImage(imgURL);
        setCurrentPreviewIndex(0);
        setPreviewHistory([imgURL]);
        setPreviewHistoryIndex(0);
    } else {
        generateFallbackPreview();
    }
};

const generateFallbackPreview = () => {
    // Create sample image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
        canvas.width = 400;
        canvas.height = 300;

        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#ff7b7b');
        gradient.addColorStop(0.5, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = 'white';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Sample Image', canvas.width / 2, canvas.height / 2 - 20);
        ctx.fillText('Quality Tools Preview', canvas.width / 2, canvas.height / 2 + 20);

        const dataUrl = canvas.toDataURL();
        setPreviewImage(dataUrl);
        setQualityPreviewImage(dataUrl);
        setCurrentPreviewIndex(0); // Reset index for fallback
        setPreviewHistory([dataUrl]);
        setPreviewHistoryIndex(0);
    }
};

    const applyQualityEffectsToPreview = async () => {
        if (!qualityPreviewImage) return;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = new Image();
        img.onload = async () => {
            canvas.width = img.width;
            canvas.height = img.height;

            // Apply current effects
            let filterString = '';
            if (selectedFilter) {
                filterString += selectedFilter.cssFilter;
            }
            if (adjustmentValues) {
                const filters = [];
                if (adjustmentValues.brightness !== 0) {
                    filters.push(`brightness(${1 + adjustmentValues.brightness / 100})`);
                }
                if (adjustmentValues.contrast !== 0) {
                    filters.push(`contrast(${1 + adjustmentValues.contrast / 100})`);
                }
                if (adjustmentValues.saturation !== 0) {
                    filters.push(`saturate(${1 + adjustmentValues.saturation / 100})`);
                }
                if (adjustmentValues.hue !== 0) {
                    filters.push(`hue-rotate(${adjustmentValues.hue}deg)`);
                }
                if (adjustmentValues.blur !== 0) {
                    filters.push(`blur(${adjustmentValues.blur}px)`);
                }
                if (adjustmentValues.sharpen !== 0) {
                    filters.push(`contrast(${1 + adjustmentValues.sharpen / 50})`);
                }
                filterString += (filterString ? ' ' : '') + filters.join(' ');
            }

            ctx.filter = filterString || 'none';
            ctx.drawImage(img, 0, 0);

            // Reset filter for overlays
            ctx.filter = 'none';

            // Add watermark
            await addWatermark(canvas, ctx);

            // Add border
            await addBorder(canvas, ctx);

            // Add signature
            await addSignature(canvas, ctx);

            const newPreviewImage = canvas.toDataURL();
            setPreviewImage(newPreviewImage);

            // Update history for undo
            setPreviewHistory(prev => [...prev.slice(0, previewHistoryIndex + 1), newPreviewImage]);
            setPreviewHistoryIndex(previewHistory.length);
        };
        img.onerror = () => {
            console.error("Failed to load quality preview image");
        };
        img.src = qualityPreviewImage;
    };

    // Apply effects automatically when quality settings change (including new opacity and position settings)
    useEffect(() => {
        if (qualityPreviewImage) {
            applyQualityEffectsToPreview();
        }
    }, [selectedFilter, adjustmentValues, watermarkText, signatureText, borderWidth, borderColor, enableWatermark, enableSignature, enableBorder, watermarkOpacity, signatureOpacity, watermarkPosition, signaturePosition, watermarkSize, signatureSize, watermarkImage, signatureImage, watermarkRotation, signatureRotation, watermarks, signatures]);

    // Auto-save quality state when important changes happen
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (qualityPreviewImage) {
                saveQualityState();
            }
        }, 1000); // Save after 1 second of inactivity

        return () => clearTimeout(timeoutId);
    }, [selectedFilter, adjustmentValues, watermarks, signatures, enableWatermark, enableSignature, enableBorder]);

    // Auto-generate preview when quality panel opens
    useEffect(() => {
        if (showQualityPanel && !qualityPreviewImage) {
            generateQualityPreview();
        }
    }, [showQualityPanel]);

    // Reset all quality settings function
    const resetAllQualitySettings = () => {
        setSelectedFilter(null);
        setAdjustmentValues(null);
        setWatermarkText('WATERMARK');
        setSignatureText('');
        setEnableWatermark(false);
        setEnableBorder(false);
        setEnableSignature(false);
        setBorderWidth(10);
        setBorderColor('#000000');
        setWatermarkOpacity(70);
        setSignatureOpacity(80);
        setWatermarkPosition({ x: 80, y: 90 });
        setSignaturePosition({ x: 5, y: 95 });
        setWatermarkSize({ width: 200, height: 50 });
        setSignatureSize({ width: 150, height: 40 });
        setWatermarkImage('');
        setSignatureImage('');
        setBorderImage('');
        setWatermarkRotation(0);
        setSignatureRotation(0);

        // Save to localStorage
        localStorage.removeItem('qualitySettings');
        localStorage.removeItem('adjustmentValues');
        localStorage.removeItem('selectedFilter');
    };

    // Save adjustments function
    const handleSaveAdjustments = async (applyToAll = false) => {
        const settings = {
            selectedFilter,
            adjustmentValues,
            watermarkText,
            signatureText,
            enableWatermark,
            enableBorder,
            enableSignature,
            borderWidth,
            borderColor,
            watermarkOpacity,
            signatureOpacity,
            watermarkPosition,
            signaturePosition,
            watermarkSize,
            signatureSize,
            watermarkImage,
            signatureImage,
            borderImage,
            watermarkRotation,
            signatureRotation
        };

        localStorage.setItem('qualitySettings', JSON.stringify(settings));

        if (applyToAll) {
            // Store original cropped images for undo functionality
            setOriginalCroppedImages({ ...croppedImages });

            // Apply effects to all cropped images
            for (const key of Object.keys(crops)) {
                const index = parseInt(key);
                const crop = crops[index];
                if (crop && crop.width && crop.height) {
                    const enhancedImage = await generateEnhancedCroppedImage(crop, index);
                    if (enhancedImage.dataUrl) {
                        setCroppedImages((prev: any) => ({
                            ...prev,
                            [index]: enhancedImage.dataUrl
                        }));
                    }
                }
            }

            alert('✅ Quality settings applied to all images!');
        } else {
            alert('💾 Quality settings saved!');
        }
    };

    // Undo adjustments function
    const handleUndoAdjustments = () => {
        if (Object.keys(originalCroppedImages).length > 0) {
            setCroppedImages(originalCroppedImages);
            setOriginalCroppedImages({});
            alert('↺ Reverted to original images!');
        }
    };

    // Load saved adjustments function
    const loadSavedAdjustments = (loadFromStorage = false) => {
        if (loadFromStorage) {
            try {
                const savedSettings = localStorage.getItem('qualitySettings');
                if (savedSettings) {
                    const settings = JSON.parse(savedSettings);

                    if (settings.selectedFilter) setSelectedFilter(settings.selectedFilter);
                    if (settings.adjustmentValues) setAdjustmentValues(settings.adjustmentValues);
                    if (settings.watermarkText) setWatermarkText(settings.watermarkText);
                    if (settings.signatureText) setSignatureText(settings.signatureText);
                    if (settings.enableWatermark !== undefined) setEnableWatermark(settings.enableWatermark);
                    if (settings.enableBorder !== undefined) setEnableBorder(settings.enableBorder);
                    if (settings.enableSignature !== undefined) setEnableSignature(settings.enableSignature);
                    if (settings.borderWidth) setBorderWidth(settings.borderWidth);
                    if (settings.borderColor) setBorderColor(settings.borderColor);
                    if (settings.watermarkOpacity) setWatermarkOpacity(settings.watermarkOpacity);
                    if (settings.signatureOpacity) setSignatureOpacity(settings.signatureOpacity);
                    if (settings.watermarkPosition) setWatermarkPosition(settings.watermarkPosition);
                    if (settings.signaturePosition) setSignaturePosition(settings.signaturePosition);
                    if (settings.watermarkSize) setWatermarkSize(settings.watermarkSize);
                    if (settings.signatureSize) setSignatureSize(settings.signatureSize);
                    if (settings.watermarkImage) setWatermarkImage(settings.watermarkImage);
                    if (settings.signatureImage) setSignatureImage(settings.signatureImage);
                    if (settings.borderImage) setBorderImage(settings.borderImage);
                    if (settings.watermarkRotation !== undefined) setWatermarkRotation(settings.watermarkRotation);
                    if (settings.signatureRotation !== undefined) setSignatureRotation(settings.signatureRotation);

                    alert('📥 Saved settings loaded successfully!');
                } else {
                    alert('⚠️ No saved settings found.');
                }
            } catch (error) {
                console.error('Error loading saved settings:', error);
                alert('❌ Error loading saved settings.');
            }
        }
    };

    // Enhanced undo function for quality effects
    const undoQualityEffect = () => {
        if (qualityHistoryIndex > 0) {
            const newIndex = qualityHistoryIndex - 1;
            const previousState = qualityHistory[newIndex];

            setSelectedFilter(previousState.selectedFilter);
            setAdjustmentValues(previousState.adjustmentValues);
            setWatermarks([...previousState.watermarks]);
            setSignatures([...previousState.signatures]);
            setEnableWatermark(previousState.enableWatermark);
            setEnableSignature(previousState.enableSignature);
            setEnableBorder(previousState.enableBorder);
            setBorderWidth(previousState.borderWidth);
            setBorderColor(previousState.borderColor);
            setPreviewImage(previousState.previewImage);
            setQualityPreviewImage(previousState.previewImage);

            setQualityHistoryIndex(newIndex);
            alert('↺ Reverted to previous quality settings!');
        } else {
            alert('⚠️ No previous quality settings to revert to.');
        }
    };

    // Enhanced redo function for quality effects
    const redoQualityEffect = () => {
        if (qualityHistoryIndex < qualityHistory.length - 1) {
            const newIndex = qualityHistoryIndex + 1;
            const nextState = qualityHistory[newIndex];

            setSelectedFilter(nextState.selectedFilter);
            setAdjustmentValues(nextState.adjustmentValues);
            setWatermarks([...nextState.watermarks]);
            setSignatures([...nextState.signatures]);
            setEnableWatermark(nextState.enableWatermark);
            setEnableSignature(nextState.enableSignature);
            setEnableBorder(nextState.enableBorder);
            setBorderWidth(nextState.borderWidth);
            setBorderColor(nextState.borderColor);
            setPreviewImage(nextState.previewImage);
            setQualityPreviewImage(nextState.previewImage);

            setQualityHistoryIndex(newIndex);
            alert('↷ Applied next quality settings!');
        } else {
            alert('⚠️ No next quality settings to apply.');
        }
    };

    // Add event listeners for new Quality Panel functionality
    useEffect(() => {
        const handleImportWatermarkEvent = () => {
            importWatermarkImage();
        };

        const handleImportSignatureEvent = () => {
            importSignatureImage();
        };

        const handleImportBorderEvent = () => {
            handleImportBorder();
        };

        const handleResetAllEffects = () => {
            resetAllQualitySettings();
            alert('All quality effects have been reset to default values!');
        };

        const handleDeleteWatermark = () => {
            setWatermarkText('');
            setWatermarkImage('');
            setEnableWatermark(false);
        };

        const handleDeleteSignature = () => {
            setSignatureText('');
            setSignatureImage('');
            setEnableSignature(false);
        };

        const handleAddNewWatermark = () => {
            addNewWatermark();
        };

        const handleAddNewSignature = () => {
            addNewSignature();
        };

        const handleUndoQuality = () => {
            undoQualityEffect();
        };

        const handleRedoQuality = () => {
            redoQualityEffect();
        };

        const handleWatermarkOpacityChange = (e: Event) => {
             const target = e.target as HTMLInputElement;
             const value = parseInt(target.value);
             setWatermarkOpacity(value);
             // Apply to all watermarks
             setWatermarks(prev => prev.map(w => ({ ...w, opacity: value })));
        };

        const handleSignatureOpacityChange = (e: Event) => {
            const target = e.target as HTMLInputElement;
            const value = parseInt(target.value);
            setSignatureOpacity(value);
            // Apply to all signatures
            setSignatures(prev => prev.map(s => ({ ...s, opacity: value })));
        };

        window.addEventListener('import-watermark', handleImportWatermarkEvent);
        window.addEventListener('import-signature', handleImportSignatureEvent);
        window.addEventListener('import-border', handleImportBorderEvent);
        window.addEventListener('reset-all-effects', handleResetAllEffects);
        window.addEventListener('watermark-opacity-change', handleWatermarkOpacityChange as EventListener);
        window.addEventListener('signature-opacity-change', handleSignatureOpacityChange as EventListener);
        window.addEventListener('delete-watermark', handleDeleteWatermark);
        window.addEventListener('delete-signature', handleDeleteSignature);
        window.addEventListener('add-watermark', handleAddNewWatermark);
        window.addEventListener('add-signature', handleAddNewSignature);
        window.addEventListener('undo-preview', handleUndoQuality);
        window.addEventListener('redo-preview', handleRedoQuality);

        return () => {
            window.removeEventListener('import-watermark', handleImportWatermarkEvent);
            window.removeEventListener('import-signature', handleImportSignatureEvent);
            window.removeEventListener('import-border', handleImportBorderEvent);
            window.removeEventListener('reset-all-effects', handleResetAllEffects);
            window.removeEventListener('watermark-opacity-change', handleWatermarkOpacityChange as EventListener);
            window.removeEventListener('signature-opacity-change', handleSignatureOpacityChange as EventListener);
            window.removeEventListener('delete-watermark', handleDeleteWatermark);
            window.removeEventListener('delete-signature', handleDeleteSignature);
            window.removeEventListener('add-watermark', handleAddNewWatermark);
            window.removeEventListener('add-signature', handleAddNewSignature);
            window.removeEventListener('undo-preview', handleUndoQuality);
            window.removeEventListener('redo-preview', handleRedoQuality);
        };
    }, [addNewWatermark, addNewSignature, undoQualityEffect, redoQualityEffect]);

    // Make function available on window object
    useEffect(() => {
        (window as any).loadSavedAdjustments = loadSavedAdjustments;
        return () => {
            delete (window as any).loadSavedAdjustments;
        };
    }, []);

    const handleSharePDF = async () => {
        try {
            const { jsPDF } = await import('jspdf');
            const indicesToShare = selectedFiles.size > 0 ? Array.from(selectedFiles) : Object.keys(crops).map(Number);

            if (indicesToShare.length === 0) {
                alert('🚨 Please crop some images first before sharing!');
                return;
            }

            const pdf = new jsPDF();
            let isFirstPage = true;

            for (let i = 0; i < indicesToShare.length; i++) {
                const index = indicesToShare[i];
                const crop = crops[index];
                if (!crop) continue;

                if (!isFirstPage) {
                    pdf.addPage();
                }
                isFirstPage = false;

                // Generate image with all quality effects applied - consistent with preview
                const enhancedImage = await generateEnhancedCroppedImage(crop, index);

                if (!enhancedImage.dataUrl) {
                    console.warn(`Skipping image ${index} - no data available`);
                    continue;
                }

                const pageWidth = pdf.internal.pageSize.getWidth();
                const pageHeight = pdf.internal.pageSize.getHeight();

                const imgAspectRatio = enhancedImage.canvas ? enhancedImage.canvas.width / enhancedImage.canvas.height : 1;
                const pageAspectRatio = pageWidth / pageHeight;

                let imgWidth, imgHeight;
                if (imgAspectRatio > pageAspectRatio) {
                    imgWidth = pageWidth - 20;
                    imgHeight = imgWidth / imgAspectRatio;
                } else {
                    imgHeight = pageHeight - 20;
                    imgWidth = imgHeight * imgAspectRatio;
                }

                const x = (pageWidth - imgWidth) / 2;
                const y = (pageHeight - imgHeight) / 2;

                try {
                    pdf.addImage(enhancedImage.dataUrl, 'PNG', x, y, imgWidth, imgHeight, undefined, 'FAST');
                } catch (imageError) {
                    console.warn(`Failed to add image ${index} to PDF:`, imageError);
                    continue;
                }
            }

            const tabName = activeTab.name.replace(/[^a-zA-Z0-9-_]/g, '_');
            const filename = `${tabName}_enhanced_${new Date().toISOString().slice(0, 10)}.pdf`;

            const pdfBlob = pdf.output('blob');

            if (navigator.share && navigator.canShare({ files: [new File([pdfBlob], filename, { type: 'application/pdf' })] })) {
                try {
                    await navigator.share({
                        title: '🎨 Enhanced Cropped Images',
                        text: 'Check out these digitally enhanced cropped images!',
                        files: [new File([pdfBlob], filename, { type: 'application/pdf' })]
                    });
                    alert('📄 PDF shared successfully!');
                } catch (shareError: any) {
                    if (shareError.name !== 'AbortError') {
                        console.log('Share failed:', shareError);
                        alert(`📄 PDF generated successfully! You can share this PDF of ${indicesToShare.length} enhanced images.`);
                    }
                }
            } else {
                // Just show message - no auto download
                alert(`📄 PDF generated successfully! You can share this PDF of ${indicesToShare.length} enhanced images.`);
            }
        } catch (error) {
            console.error('Error creating PDF:', error);
            alert('❌ Error creating PDF. Please try again or check your images.');
        }
    };

    const generateCroppedImage = (crop: any, index: number) => {
        const resizeImageToCrop = resizeOnExport && cropSize != null && cropSize.width === cropSize.height ? cropSize : crop;
        const image = crop?.image;
        if (!image || !image.naturalWidth || !image.naturalHeight) {
            console.error('Invalid image data for crop:', crop, index);
            return {
                canvas: null,
                dataUrl: '',
                filename: `cropped_${String(index + 1).padStart(3, '0')}.png`
            };
        }
        const canvas = document.createElement("canvas");
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;

        const pixelRatio = Math.max(window.devicePixelRatio * 2, 4);
        canvas.width = resizeImageToCrop.width * pixelRatio;
        canvas.height = resizeImageToCrop.height * pixelRatio;

        const ctx: any = canvas.getContext("2d");

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.textRenderingOptimization = "optimizeQuality";

        ctx.scale(pixelRatio, pixelRatio);

        ctx.drawImage(
            image,
            crop.x * scaleX,
            crop.y * scaleY,
            crop.width * scaleX,
            crop.height * scaleY,
            0,
            0,
            resizeImageToCrop.width,
            resizeImageToCrop.height
        );

        return {
            canvas,
            dataUrl: canvas.toDataURL("image/png"),
            filename: crop?.name || `cropped_${String(index + 1).padStart(3, '0')}.png`
        };
    };

    // Enhanced version that applies all effects consistently
    const generateEnhancedCroppedImage = async (crop: any, index: number) => {
        try {
            const resizeImageToCrop = resizeOnExport && cropSize != null && cropSize.width === cropSize.height ? cropSize : crop;
            const image = crop?.image;

            if (!image || !image.naturalWidth || !image.naturalHeight) {
                console.error('Invalid image data for crop:', crop, index);
                return {
                    canvas: null,
                    dataUrl: '',
                    filename: `cropped_${String(index + 1).padStart(3, '0')}.png`
                };
            }

            if (!crop.width || !crop.height) {
                console.error('Invalid crop dimensions:', crop);
                return {
                    canvas: null,
                    dataUrl: '',
                    filename: `cropped_${String(index + 1).padStart(3, '0')}.png`
                };
            }

            const canvas = document.createElement("canvas");
            const scaleX = image.naturalWidth / image.width;
            const scaleY = image.naturalHeight / image.height;

            // Use consistent sizing for better quality, but match original resolution
            const targetWidth = (resizeImageToCrop.width || crop.width) * scaleX;
            const targetHeight = (resizeImageToCrop.height || crop.height) * scaleY;

            canvas.width = targetWidth;
            canvas.height = targetHeight;

            const ctx = canvas.getContext("2d");
            if (!ctx) {
                console.error('Failed to get canvas context');
                return {
                    canvas: null,
                    dataUrl: '',
                    filename: `cropped_${String(index + 1).padStart(3, '0')}.png`
                };
            }

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";

            // Apply transformations before drawing - consistent with preview
            let filterString = '';
            if (selectedFilter) {
                filterString += selectedFilter.cssFilter;
            }
            if (adjustmentValues) {
                const filters = [];
                if (adjustmentValues.brightness !== 0) {
                    filters.push(`brightness(${1 + adjustmentValues.brightness / 100})`);
                }
                if (adjustmentValues.contrast !== 0) {
                    filters.push(`contrast(${1 + adjustmentValues.contrast / 100})`);
                }
                if (adjustmentValues.saturation !== 0) {
                    filters.push(`saturate(${1 + adjustmentValues.saturation / 100})`);
                }
                if (adjustmentValues.hue !== 0) {
                    filters.push(`hue-rotate(${adjustmentValues.hue}deg)`);
                }
                if (adjustmentValues.blur !== 0) {
                    filters.push(`blur(${adjustmentValues.blur}px)`);
                }
                if (adjustmentValues.sharpen !== 0) {
                    filters.push(`contrast(${1 + adjustmentValues.sharpen / 50})`);
                }
                filterString += (filterString ? ' ' : '') + filters.join(' ');
            }

            ctx.filter = filterString || 'none';

            ctx.drawImage(
                image,
                crop.x * scaleX,
                crop.y * scaleY,
                crop.width * scaleX,
                crop.height * scaleY,
                0,
                0,
                targetWidth,
                targetHeight
            );

            // Reset filter for overlays
            ctx.filter = 'none';

            // Add watermark
            await addWatermark(canvas, ctx);

            // Add border
            await addBorder(canvas, ctx);

            // Add signature
            await addSignature(canvas, ctx);

            return {
                canvas,
                dataUrl: canvas.toDataURL("image/png"),
                filename: crop?.name || `cropped_${String(index + 1).padStart(3, '0')}.png`
            };
        } catch (error) {
            console.error('Error in generateEnhancedCroppedImage:', error);
            return {
                canvas: null,
                dataUrl: '',
                filename: `cropped_${String(index + 1).padStart(3, '0')}.png`
            };
        }
    };

    const onSaveCropped = async () => {
        const indicesToSave = selectedFiles.size > 0 ? Array.from(selectedFiles) : Object.keys(crops).map(Number);

        for (const index of indicesToSave) {
            const crop = crops[index];
            if (crop) {
                const croppedImage = await generateEnhancedCroppedImage(crop, index);
                if (croppedImage.canvas && croppedImage.dataUrl) {
                    const link = document.createElement('a');
                    link.download = croppedImage.filename;
                    link.href = croppedImage.dataUrl;
                    link.click();
                } else {
                    console.warn(`Skipping image ${index} due to invalid data`);
                }
            }
        }
    };

    const onSaveAsZip = async () => {
        const jobId = `zip-${Date.now()}`;
        const indicesToSave = selectedFiles.size > 0 ? Array.from(selectedFiles) : Object.keys(crops).map(Number);

        const newJob: ProcessingJob = {
            id: jobId,
            name: `ZIP Export (${indicesToSave.length} images)`,
            progress: 0,
            total: indicesToSave.length,
            status: 'processing',
            type: 'zip',
            timestamp: Date.now()
        };

        setProcessingJobs(prev => [...prev, newJob]);

        try {
            const JSZip = (await import('jszip')).default;
            const zip = new JSZip();

            for (let i = 0; i < indicesToSave.length; i++) {
                const index = indicesToSave[i];
                const crop = crops[index];
                if (crop) {
                    try {
                        const croppedImage = await generateEnhancedCroppedImage(crop, index);
                        if (!croppedImage.canvas || !croppedImage.dataUrl) {
                            console.warn(`Skipping image ${index} due to invalid data`);
                            continue;
                        }
                        const base64Data = croppedImage.dataUrl.split(',')[1];
                        zip.file(croppedImage.filename, base64Data, { base64: true });

                        setProcessingJobs(prev => prev.map(job =>
                            job.id === jobId ? { ...job, progress: i + 1 } : job
                        ));
                    } catch (imageError) {
                        console.warn(`Failed to process image ${index}:`, imageError);
                    }
                }
            }

            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(zipBlob);
            link.download = `cropped_images_${new Date().toISOString().slice(0, 10)}.zip`;
            link.click();

            // Clean up URL after a delay
            setTimeout(() => {
                URL.revokeObjectURL(link.href);
            }, 100);

            setProcessingJobs(prev => prev.map(job =>
                job.id === jobId ? { ...job, status: 'completed', result: { filename: link.download } } : job
            ));

            // Add to history
            const historyItem: HistoryItem = {
                id: `history-${Date.now()}`,
                name: `ZIP Export - ${indicesToSave.length} images`,
                timestamp: Date.now(),
                files: files.filter((_, i) => indicesToSave.includes(i)),
                crops: Object.fromEntries(indicesToSave.map(i => [i, crops[i]]).filter(([_, crop]) => crop)),
                settings: { cropSize, keepRatio, resizeOnExport, lockMovement, centerCrop, enableOCR },
                exportedFiles: indicesToSave.map(i => crops[i] ? generateCroppedImage(crops[i], i) : null).filter(Boolean)
            };
            setHistory(prev => [historyItem, ...prev]);

        } catch (error) {
            console.error('Error creating ZIP:', error);
            setProcessingJobs(prev => prev.map(job =>
                job.id === jobId ? { ...job, status: 'error' } : job
            ));
        }
    };

    const onGeneratePDF = async () => {
        const jobId = `pdf-${Date.now()}`;
        const indicesToSave = selectedFiles.size > 0 ? Array.from(selectedFiles) : Object.keys(crops).map(Number);

        const newJob: ProcessingJob = {
            id: jobId,
            name: `PDF Export (${indicesToSave.length} images)`,
            progress: 0,
            total: indicesToSave.length,
            status: 'processing',
            type: 'pdf',
            timestamp: Date.now()
        };

        setProcessingJobs(prev => [...prev, newJob]);

        try {
            const { jsPDF } = await import('jspdf');
            const Tesseract = enableOCR ? await import('tesseract.js') : null;

            const pdf = new jsPDF();
            let isFirstPage = true;

            for (let i = 0; i < indicesToSave.length; i++) {
                const index = indicesToSave[i];
                const crop = crops[index];
                if (!crop) continue;

                try {
                    if (!isFirstPage) {
                        pdf.addPage();
                    }
                    isFirstPage = false;

                    const croppedImage = await generateEnhancedCroppedImage(crop, index);
                    if (!croppedImage.canvas) {
                        console.warn(`Skipping image ${index} due to invalid data`);
                        continue;
                    }
                    const pageWidth = pdf.internal.pageSize.getWidth();
                    const pageHeight = pdf.internal.pageSize.getHeight();

                    const imgAspectRatio = croppedImage.canvas.width / croppedImage.canvas.height;
                    const pageAspectRatio = pageWidth / pageHeight;

                    let imgWidth, imgHeight;
                    if (imgAspectRatio > pageAspectRatio) {
                        imgWidth = pageWidth - 20;
                        imgHeight = imgWidth / imgAspectRatio;
                    } else {
                        imgHeight = pageHeight - 20;
                        imgWidth = imgHeight * imgAspectRatio;
                    }

                    const x = (pageWidth - imgWidth) / 2;
                    const y = (pageHeight - imgHeight) / 2;

                    pdf.addImage(croppedImage.dataUrl, 'JPEG', x, y, imgWidth, imgHeight);

                    if (enableOCR && Tesseract) {
                        try {
                            console.log(`Performing OCR on image ${index + 1}...`);
                            const ocrResult = await Tesseract.recognize(croppedImage.canvas, 'eng', {
                                logger: () => {} // Suppress OCR logs to reduce console noise
                            });
                            const extractedText = ocrResult.data.text.trim();

                            if (extractedText && extractedText.length > 0) {
                                const cleanText = extractedText.replace(/\s+/g, ' ').trim();
                                pdf.setFontSize(8);
                                pdf.setTextColor(0, 0, 0, 0.00001);

                                const maxCharsPerLine = 80;
                                const lines = [];
                                const words = cleanText.split(' ');
                                let currentLine = '';

                                words.forEach(word => {
                                    if ((currentLine + ' ' + word).length <= maxCharsPerLine) {
                                        currentLine += (currentLine ? ' ' : '') + word;
                                    } else {
                                        if (currentLine) lines.push(currentLine);
                                        currentLine = word;
                                    }
                                });
                                if (currentLine) lines.push(currentLine);

                                lines.forEach((line, lineIndex) => {
                                    const textX = x;
                                    const textY = y + 10 + (lineIndex * 8);
                                    if (textY < pageHeight - 10) {
                                        pdf.text(line, textX, textY);
                                    }
                                });
                            }
                        } catch (ocrError) {
                            console.warn(`OCR failed for image ${index + 1}:`, ocrError);
                        }
                    }
                } catch (imageError) {
                    console.warn(`Failed to process image ${index}:`, imageError);
                }

                setProcessingJobs(prev => prev.map(job =>
                    job.id === jobId ? { ...job, progress: i + 1 } : job
                ));
            }

            const tabName = activeTab.name.replace(/[^a-zA-Z0-9-_]/g, '_');
            const filename = `${tabName}_${new Date().toISOString().slice(0, 10)}.pdf`;
            pdf.save(filename);

            setProcessingJobs(prev => prev.map(job =>
                job.id === jobId ? { ...job, status: 'completed', result: { filename } } : job
            ));

            // Add to history
            const historyItem: HistoryItem = {
                id: `history-${Date.now()}`,
                name: `PDF Export - ${indicesToSave.length} images`,
                timestamp: Date.now(),
                files: files.filter((_, i) => indicesToSave.includes(i)),
                crops: Object.fromEntries(indicesToSave.map(i => [i, crops[i]]).filter(([_, crop]) => crop)),
                settings: { cropSize, keepRatio, resizeOnExport, lockMovement, centerCrop, enableOCR },
                exportedFiles: indicesToSave.map(i => crops[i] ? generateCroppedImage(crops[i], i) : null).filter(Boolean)
            };
            setHistory(prev => [historyItem, ...prev]);

        } catch (error) {
            console.error('Error creating PDF:', error);
            setProcessingJobs(prev => prev.map(job =>
                job.id === jobId ? { ...job, status: 'error' } : job
            ));
        }
    };

    const removeProcessingJob = (jobId: string) => {
        setProcessingJobs(prev => prev.filter(job => job.id !== jobId));
    };

    const loadFromHistory = (historyItem: HistoryItem) => {
        const newTabId = `tab-${Date.now()}`;
        const newTab: CropTab = {
            id: newTabId,
            name: `Restored: ${historyItem.name}`,
            files: historyItem.files,
            crops: historyItem.crops,
            settings: historyItem.settings,
            isActive: true
        };

        setTabs(prev => [...prev.map(t => ({...t, isActive: false})), newTab]);
        setActiveTabId(newTabId);
        setCurrentView('crop');
    };

    const deleteHistoryItem = (historyId: string) => {
        setHistory(prev => prev.filter(item => item.id !== historyId));
    };

    const onSelectSomeFiles = () => {
        inputRef?.current?.click();
    };

    const onSelectFolder = () => {
        folderInputRef?.current?.click();
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'o':
                        e.preventDefault();
                        onSelectSomeFiles();
                        break;
                    case 'f':
                        e.preventDefault();
                        onSelectFolder();
                        break;
                    case 'a':
                        e.preventDefault();
                        selectAllFiles();
                        break;
                    case 'e':
                        e.preventDefault();
                        if (Object.keys(crops).length > 0) onSaveCropped();
                        break;
                    case 'z':
                        e.preventDefault();
                        if (Object.keys(crops).length > 0) onSaveAsZip();
                        break;
                    case 'p':
                        e.preventDefault();
                        if (Object.keys(crops).length > 0) onGeneratePDF();
                        break;
                }
            }
            if (e.key === 'Escape') {
                clearSelection();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [crops]); // Depend on crops to re-register if crops change

    // Total file size calculation
    const getTotalFileSize = () => {
        const totalBytes = files.reduce((sum, file) => sum + (file.size || 0), 0);
        if (totalBytes < 1024) return `${totalBytes} B`;
        if (totalBytes < 1024 * 1024) return `${(totalBytes / 1024).toFixed(1)} KB`;
        return `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    // Arrow-based movement functions for rearrange mode
    const moveImage = (fromIndex: number, direction: 'up' | 'down' | 'left' | 'right') => {
        if (!rearrangeMode || files.length < 2) return;

        let toIndex = fromIndex;

        if (gridView) {
            // For grid view, calculate columns based on container width
            const containerWidth = window.innerWidth - 32; // Account for padding
            const itemWidth = 300 + 8; // Min width + gap
            const columns = Math.floor(containerWidth / itemWidth) || 1;

            switch (direction) {
                case 'up':
                    // Only swap with the image directly above
                    toIndex = fromIndex - columns;
                    if (toIndex < 0) return; // No image above
                    break;
                case 'down':
                    // Only swap with the image directly below
                    toIndex = fromIndex + columns;
                    if (toIndex >= files.length) return; // No image below
                    break;
                case 'left':
                    toIndex = Math.max(0, fromIndex - 1);
                    break;
                case 'right':
                    toIndex = Math.min(files.length - 1, fromIndex + 1);
                    break;
            }
        } else {
            // For single row view
            switch (direction) {
                case 'left':
                case 'up':
                    toIndex = Math.max(0, fromIndex - 1);
                    break;
                case 'right':
                case 'down':
                    toIndex = Math.min(files.length - 1, fromIndex + 1);
                    break;
            }
        }

        if (toIndex !== fromIndex && toIndex >= 0 && toIndex < files.length) {
            // Simple swap - only exchange positions between two adjacent images
            const newFiles = [...files];
            [newFiles[fromIndex], newFiles[toIndex]] = [newFiles[toIndex], newFiles[fromIndex]];

            // Update crops - simple swap
            const newCrops: any = { ...crops };
            const fromCrop = newCrops[fromIndex];
            const toCrop = newCrops[toIndex];

            if (fromCrop) newCrops[toIndex] = { ...fromCrop, image: files[toIndex] }; // Update image reference
            else delete newCrops[toIndex];

            if (toCrop) newCrops[fromIndex] = { ...toCrop, image: files[fromIndex] }; // Update image reference
            else delete newCrops[fromIndex];

            // Update selected files - simple swap
            const newSelectedFiles = new Set<number>();
            selectedFiles.forEach(index => {
                if (index === fromIndex) {
                    newSelectedFiles.add(toIndex);
                } else if (index === toIndex) {
                    newSelectedFiles.add(fromIndex);
                } else {
                    newSelectedFiles.add(index);
                }
            });

            setFiles(newFiles);
            setCrops(newCrops);
            setSelectedFiles(newSelectedFiles);
        }
    };

    const toggleRearrangeMode = () => {
        setRearrangeMode(!rearrangeMode);
        if (rearrangeMode) {
            // Save arrangement when exiting rearrange mode
            saveCurrentTabState();
        }
    };

    // Navigation functions for floating preview
    const goToNextPreviewImage = async () => {
        const croppedImageKeys = Object.keys(crops).filter(key => crops[parseInt(key)] && crops[parseInt(key)].width && crops[parseInt(key)].height);
        if (croppedImageKeys.length === 0) return;

        const currentKeyIndex = croppedImageKeys.indexOf(currentPreviewIndex.toString());
        const nextIndex = currentKeyIndex < croppedImageKeys.length - 1 ? currentKeyIndex + 1 : 0;
        const nextImageIndex = parseInt(croppedImageKeys[nextIndex]);

        setCurrentPreviewIndex(nextImageIndex);

        // Generate preview for the next image with all effects applied
        const crop = crops[nextImageIndex];
        if (crop) {
            try {
                const enhancedImage = await generateEnhancedCroppedImage(crop, nextImageIndex);
                if (enhancedImage && enhancedImage.dataUrl) {
                    setPreviewImage(enhancedImage.dataUrl);
                    setQualityPreviewImage(enhancedImage.dataUrl);
                    // Update history for undo
                    setPreviewHistory(prev => [...prev.slice(0, previewHistoryIndex + 1), enhancedImage.dataUrl]);
                    setPreviewHistoryIndex(previewHistory.length);
                }
            } catch (error) {
                console.error('Error generating next preview image:', error);
            }
        }
    };

    const goToPrevPreviewImage = async () => {
        const croppedImageKeys = Object.keys(crops).filter(key => crops[parseInt(key)] && crops[parseInt(key)].width && crops[parseInt(key)].height);
        if (croppedImageKeys.length === 0) return;

        const currentKeyIndex = croppedImageKeys.indexOf(currentPreviewIndex.toString());
        const prevIndex = currentKeyIndex > 0 ? currentKeyIndex - 1 : croppedImageKeys.length - 1;
        const prevImageIndex = parseInt(croppedImageKeys[prevIndex]);

        setCurrentPreviewIndex(prevImageIndex);

        // Generate preview for the previous image with all effects applied
        const crop = crops[prevImageIndex];
        if (crop) {
            try {
                const enhancedImage = await generateEnhancedCroppedImage(crop, prevImageIndex);
                if (enhancedImage && enhancedImage.dataUrl) {
                    setPreviewImage(enhancedImage.dataUrl);
                    setQualityPreviewImage(enhancedImage.dataUrl);
                    // Update history for undo
                    setPreviewHistory(prev => [...prev.slice(0, previewHistoryIndex + 1), enhancedImage.dataUrl]);
                    setPreviewHistoryIndex(previewHistory.length);
                }
            } catch (error) {
                console.error('Error generating previous preview image:', error);
            }
        }
    };

    // Save current quality state to history
    const saveQualityState = () => {
        const currentState = {
            timestamp: Date.now(),
            selectedFilter,
            adjustmentValues,
            watermarks: [...watermarks],
            signatures: [...signatures],
            enableWatermark,
            enableSignature,
            enableBorder,
            borderWidth,
            borderColor,
            previewImage
        };

        setQualityHistory(prev => [...prev.slice(0, qualityHistoryIndex + 1), currentState]);
        setQualityHistoryIndex(qualityHistory.length);
    };

    const undoPreviewChange = () => {
        if (previewHistoryIndex > 0) {
            const newIndex = previewHistoryIndex - 1;
            setPreviewHistoryIndex(newIndex);
            setPreviewImage(previewHistory[newIndex]);
            setQualityPreviewImage(previewHistory[newIndex]);
        }
    };

    const getProcessedCount = () => {
        return Object.keys(crops).filter(key => crops[parseInt(key)]?.width && crops[parseInt(key)]?.height).length;
    };

    // Toggle zoom for a specific image
    const toggleZoom = (index: number) => {
        setZoomedImages((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    };

    // Toggle visibility for floating images
    const toggleFloating = (index: number) => {
        setFloatingImages((prev) => ({
            ...prev,
            [index]: {
                ...(prev[index] || { position: { x: 100, y: 100 }, size: { width: 300, height: 200 }, visible: true }),
                visible: !prev[index]?.visible,
            },
        }));
    };

    // Update position for floating images
    const updateFloatingPosition = (index: number, position: { x: number, y: number }) => {
        setFloatingImages((prev) => ({
            ...prev,
            [index]: {
                ...(prev[index] || { position: { x: 100, y: 100 }, size: { width: 300, height: 200 }, visible: true }),
                position,
            },
        }));
    };

    // Update size for floating images
    const updateFloatingSize = (index: number, size: { width: number, height: number }) => {
        setFloatingImages((prev) => ({
            ...prev,
            [index]: {
                ...(prev[index] || { position: { x: 100, y: 100 }, size: { width: 300, height: 200 }, visible: true }),
                size,
            },
        }));
    };

    // Close a floating image
    const closeFloatingImage = (index: number) => {
        setFloatingImages((prev) => {
            const newState = { ...prev };
            delete newState[index];
            return newState;
        });
    };

    // Save current state of preview image for undo
    const savePreviewState = () => {
        if (previewImage) {
            setPreviewHistory(prev => [...prev.slice(0, previewHistoryIndex + 1), previewImage]);
            setPreviewHistoryIndex(previewHistory.length);
        }
    };

    const savePreviewStateAndApply = () => {
        savePreviewState();
        applyQualityEffectsToPreview();
    };

    return (
        <div style={{
            overflow: "auto",
            width: "100%",
            height: "100vh",
            padding: "0",
            background: `
                linear-gradient(135deg, #000814 0%, #001d3d 25%, #003566 50%, #001d3d 75%, #000814 100%),
                repeating-linear-gradient(45deg,
                    rgba(0, 255, 255, 0.03) 0px,
                    rgba(0, 255, 255, 0.03) 2px,
                    transparent 2px,
                    transparent 20px
                )
            `,
            position: "relative"
        }}>
            {/* Status Bar Buffer - Always Present Global Header */}
            <StatusBarBuffer />
            
            <>
                {/* Tab Bar */}
                <div style={{
                    display: "flex",
                    gap: "4px",
                    padding: "8px",
                    background: "linear-gradient(135deg, rgba(0, 20, 40, 0.95), rgba(0, 40, 80, 0.85))",
                    borderBottom: "2px solid rgba(0, 255, 255, 0.3)",
                    overflowX: "auto",
                    boxShadow: "0 2px 15px rgba(0, 255, 255, 0.2)",
                    backdropFilter: "blur(10px)"
                }}>
                    {tabs.map(tab => (
                        <div key={tab.id} style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "8px 16px",
                            background: tab.id === activeTabId
                                ? "linear-gradient(135deg, #00ffff, #0080ff)"
                                : "linear-gradient(135deg, rgba(0, 40, 80, 0.8), rgba(0, 20, 40, 0.9))",
                            color: tab.id === activeTabId ? "#000" : "#00bfff",
                            borderRadius: "8px",
                            whiteSpace: "nowrap",
                            border: `1px solid ${tab.id === activeTabId ? "#00ffff" : "rgba(0, 255, 255, 0.3)"}`,
                            boxShadow: tab.id === activeTabId
                                ? "0 0 20px rgba(0, 255, 255, 0.6)"
                                : "0 0 10px rgba(0, 255, 255, 0.2)",
                            transition: "all 0.3s ease",
                            fontWeight: "600",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            fontFamily: "'Orbitron', monospace"
                        }}>
                            {editingTabId === tab.id ? (
                                <div style={{ display: "flex", gap: "3px", alignItems: "center" }}>
                                    <input
                                        type="text"
                                        value={editingTabName}
                                        onChange={(e) => setEditingTabName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') saveTabName();
                                            if (e.key === 'Escape') cancelEditingTab();
                                        }}
                                        onBlur={saveTabName}
                                        autoFocus
                                        style={{
                                            background: "#555",
                                            border: "1px solid #777",
                                            color: "white",
                                            padding: "2px 5px",
                                            fontSize: "12px",
                                            width: "120px"
                                        }}
                                    />
                                    <button onClick={saveTabName} style={{ background: "none", border: "none", color: "#4CAF50", fontSize: "10px" }}>✓</button>
                                    <button onClick={cancelEditingTab} style={{ background: "none", border: "none", color: "#f44336", fontSize: "10px" }}>✕</button>
                                </div>
                            ) : (
                                <>
                                    <span
                                        onClick={() => setActiveTabId(tab.id)}
                                        style={{ cursor: "pointer" }}
                                    >
                                        {tab.name}
                                    </span>
                                    <button
                                        onClick={() => startEditingTab(tab.id, tab.name)}
                                        style={{
                                            background: "none",
                                            border: "none",
                                            color: "#888",
                                            cursor: "pointer",
                                            fontSize: "10px"
                                        }}
                                        title="Edit tab name"
                                    >
                                        ✏️
                                    </button>
                                    {tabs.length > 1 && (
                                        <button
                                            onClick={() => closeTab(tab.id)}
                                            style={{
                                                background: "none",
                                                border: "none",
                                                color: "#888",
                                                cursor: "pointer",
                                                fontSize: "12px"
                                            }}
                                        >
                                            ✕
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    ))}
                    <button
                        onClick={addNewTab}
                        style={{
                            background: "#333",
                            border: "none",
                            color: "white",
                            padding: "5px 10px",
                            borderRadius: "3px",
                            cursor: "pointer"
                        }}
                    >
                        + New Tab
                    </button>
                </div>

                {/* Mode Toggle */}
                <div style={{
                    display: "flex",
                    gap: "8px",
                    padding: "10px",
                    background: "linear-gradient(135deg, rgba(0, 20, 40, 0.8), rgba(0, 40, 80, 0.6))",
                    borderBottom: "1px solid rgba(0, 255, 255, 0.2)",
                    boxShadow: "0 1px 10px rgba(0, 255, 255, 0.1)",
                    alignItems: "center",
                    justifyContent: "space-between"
                }}>
                    <div style={{ display: "flex", gap: "8px" }}>
                        <button
                            onClick={() => {
                                setCurrentMode('cropper');
                                setShowPDFMaster(false);
                                setShowMolView(false);
                            }}
                            className={currentMode === 'cropper' ? 'export-button' : 'button'}
                            style={{
                                background: currentMode === 'cropper' 
                                    ? 'linear-gradient(45deg, #4CAF50, #45a049)' 
                                    : 'linear-gradient(45deg, #666, #555)',
                                color: 'white',
                                border: 'none',
                                padding: '10px 16px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                boxShadow: currentMode === 'cropper' ? '0 4px 12px rgba(76, 175, 80, 0.3)' : 'none'
                            }}
                        >
                            🖼️ Image Cropper
                        </button>
                        <button
                            onClick={() => {
                                setCurrentMode('pdfmaster');
                                setShowPDFMaster(true);
                                setShowMolView(false);
                            }}
                            className={currentMode === 'pdfmaster' ? 'export-button' : 'button'}
                            style={{
                                background: currentMode === 'pdfmaster' 
                                    ? 'linear-gradient(45deg, #FF9800, #F57C00)' 
                                    : 'linear-gradient(45deg, #666, #555)',
                                color: 'white',
                                border: 'none',
                                padding: '10px 16px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                boxShadow: currentMode === 'pdfmaster' ? '0 4px 12px rgba(255, 152, 0, 0.3)' : 'none'
                            }}
                        >
                            📄 PDF Master
                        </button>
                        <button
                            onClick={() => {
                                setCurrentMode('molview');
                                setShowMolView(true);
                                setShowPDFMaster(false);
                            }}
                            className={currentMode === 'molview' ? 'export-button' : 'button'}
                            style={{
                                background: currentMode === 'molview' 
                                    ? 'linear-gradient(45deg, #2E8B57, #228B22)' 
                                    : 'linear-gradient(45deg, #666, #555)',
                                color: 'white',
                                border: 'none',
                                padding: '10px 16px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                boxShadow: currentMode === 'molview' ? '0 4px 12px rgba(46, 139, 87, 0.3)' : 'none'
                            }}
                        >
                            🧪 MolView
                        </button>
                    </div>
                    
                    {currentMode === 'cropper' && (
                        <div style={{ display: "flex", gap: "8px" }}>
                            <button
                                onClick={() => setCurrentView('crop')}
                                className={currentView === 'crop' ? 'export-button' : 'button'}
                            >
                                🖼️ Cropping
                            </button>
                            <button
                                onClick={() => setCurrentView('history')}
                                className={currentView === 'history' ? 'export-button' : 'button'}
                            >
                                📜 History ({history.length})
                            </button>
                        </div>
                    )}
                </div>

                {/* Background Processing Jobs */}
                {processingJobs.length > 0 && (
                    <div style={{
                        padding: "10px",
                        background: "rgba(0,0,0,0.8)",
                        color: "white"
                    }}>
                        <h4>Background Processing:</h4>
                        {processingJobs.map(job => (
                            <div key={job.id} style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "5px",
                                background: "rgba(255,255,255,0.1)",
                                margin: "2px 0",
                                borderRadius: "3px"
                            }}>
                                <span>{job.name}</span>
                                <div style={{display: "flex", alignItems: "center", gap: "10px"}}>
                                    {job.status === 'processing' && (
                                        <span>{job.progress}/{job.total}</span>
                                    )}
                                    <span>{job.status}</span>
                                    <button onClick={() => removeProcessingJob(job.id)}>✕</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* History View */}
                {currentView === 'history' && (
                    <div style={{ padding: "20px", color: "white" }}>
                        <h2>Export History</h2>
                        {history.length === 0 ? (
                            <p>No exports yet. Create some crops and export them to see history.</p>
                        ) : (
                            <div style={{ display: "grid", gap: "10px" }}>
                                {history.map(item => (
                                    <div key={item.id} style={{
                                        padding: "15px",
                                        background: "rgba(255,255,255,0.1)",
                                        borderRadius: "5px",
                                        border: "1px solid #333"
                                    }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <div>
                                                <h4>{item.name}</h4>
                                                <p style={{ fontSize: "12px", color: "#ccc" }}>
                                                    {new Date(item.timestamp).toLocaleString()} • {item.files.length} images
                                                </p>
                                            </div>
                                            <div style={{ display: "flex", gap: "5px" }}>
                                                <button onClick={() => loadFromHistory(item)} className="button">
                                                    🔄 Restore & Edit
                                                </button>
                                                <button onClick={() => deleteHistoryItem(item.id)} className="circle-button">
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Cropping View */}
                {currentView === 'crop' && (
                    <>
                        <div className="top-header" style={{display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 20px", background: "linear-gradient(135deg, rgba(0, 20, 40, 0.9), rgba(0, 40, 80, 0.7))", borderBottom: "1px solid rgba(0, 255, 255, 0.2)"}}>
                            <div style={{display: "flex", alignItems: "center", gap: "15px", color: "#00bfff", fontSize: "14px"}}>
                                <span>📊 {files.length} files ({getTotalFileSize()}) • ✂️ {getProcessedCount()} cropped</span>
                                {selectedFiles.size > 0 && (
                                    <span style={{color: "#4CAF50"}}>✓ {selectedFiles.size} selected</span>
                                )}
                                <div style={{display: "flex", alignItems: "center", gap: "8px", color: "#00bfff"}}>
                                    <span style={{fontSize: "12px", minWidth: "40px"}}>🔍 {zoomLevel}%</span>
                                    <input
                                        type="range"
                                        min="50"
                                        max="200"
                                        value={zoomLevel}
                                        onChange={(e) => setZoomLevel(parseInt(e.target.value))}
                                        style={{
                                            width: "80px",
                                            height: "4px",
                                            background: "linear-gradient(to right, #00ffff, #0080ff)",
                                            borderRadius: "2px",
                                            outline: "none",
                                            cursor: "pointer"
                                        }}
                                        title="Zoom Level"
                                    />
                                </div>
                            </div>
                            <div style={{display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap"}}>
                                <button onClick={onSelectSomeFiles} className="button" title="Ctrl+O">🖼️ Add Files</button>
                                <button onClick={onSelectFolder} className="button" title="Ctrl+F">📁 Add Folder</button>
                                {selectedFiles.size > 0 && (
                                    <>
                                        <button onClick={selectAllFiles} className="button" title="Ctrl+A">🔲 Select All</button>
                                        <button onClick={clearSelection} className="button" title="Escape">❌ Clear</button>
                                        <button
                                            onClick={() => {
                                                if (window.confirm(`Delete ${selectedFiles.size} selected images?`)) {
                                                    const sortedIndices = Array.from(selectedFiles).sort((a, b) => b - a);
                                                    sortedIndices.forEach(index => {
                                                        onRemoveImage(index);
                                                    });
                                                    clearSelection();
                                                }
                                            }}
                                            className="button"
                                            style={{
                                                background: "linear-gradient(135deg, #f44336, #d32f2f)",
                                                color: "white"
                                            }}
                                            title="Delete Selected Images"
                                        >
                                            🗑️ Delete Selected
                                        </button>
                                    </>
                                )}
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={(e: any) => {
                                        onSetFiles(e.target.files);
                                    }}
                                    ref={inputRef}
                                    className="file-input"
                                    style={{display: "none"}}
                                />
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    {...({ webkitdirectory: "" } as any)}
                                    onChange={(e: any) => {
                                        onSetFiles(e.target.files);
                                    }}
                                    ref={folderInputRef}
                                    className="file-input"
                                    style={{display: "none"}}
                                />
                            </div>
                        </div>

                        {/* Horizontal Toolbox */}
                        <div style={{
                            padding: "10px 20px",
                            background: "linear-gradient(135deg, rgba(0, 20, 40, 0.9), rgba(0, 40, 80, 0.7))",
                            borderBottom: "1px solid rgba(0, 255, 255, 0.2)",
                            border: "1px solid rgba(0, 255, 255, 0.2)",
                            borderRadius: "10px",
                            margin: "10px 20px",
                            boxShadow: "0 0 20px rgba(0, 255, 255, 0.2)"
                        }}>
                            {/* First Row - Crop Controls */}
                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                marginBottom: "10px",
                                flexWrap: "wrap",
                                justifyContent: "flex-start"
                            }}>
                                <button onClick={onSetAllToCrop} style={{
                                    background: 'linear-gradient(135deg, #4CAF50, #45a049)',
                                    color: 'white',
                                    border: 'none',
                                    padding: '8px 15px',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                                }}>Set All</button>
                                <Select selectItems={cropSizePresets} selectId="crop-presets" onSelect={setCropSize}/>
                                <div onClick={()=> setKeepRatio((prev:boolean) => !prev)} className="checkbox">
                                    <input type="checkbox" checked={keepRatio} readOnly />
                                    <div className="box-bg">Keep Ratio</div>
                                </div>
                                <div onClick={()=> setLockMovement((prev:boolean) => !prev)} className="checkbox">
                                    <input type="checkbox" checked={lockMovement} readOnly />
                                    <div className="box-bg">🔒 Lock</div>
                                </div>
                                <div onClick={()=> setCenterCrop((prev:boolean) => !prev)} className="checkbox">
                                    <input type="checkbox" checked={centerCrop} readOnly />
                                    <div className="box-bg">🎯 Center</div>
                                </div>
                                <div onClick={toggleRearrangeMode} className="checkbox">
                                    <input type="checkbox" checked={rearrangeMode} readOnly />
                                    <div className="box-bg">🔄 Rearrange</div>
                                </div>
                            </div>

                            {/* Second Row - View & Export Controls */}
                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                flexWrap: "wrap",
                                justifyContent: "flex-start"
                            }}>
                                <div onClick={()=> setGridView((prev:boolean) => !prev)} className="checkbox">
                                    <input type="checkbox" checked={gridView} readOnly />
                                    <div className="box-bg">📱 Grid View</div>
                                </div>
                                <div onClick={()=> setEnableOCR((prev:boolean) => !prev)} className="checkbox">
                                    <input type="checkbox" checked={enableOCR} readOnly />
                                    <div className="box-bg">🔍 OCR</div>
                                </div>
                                <button
                                    className={`quality-toggle-btn ${showQualityPanel ? 'active' : ''}`}
                                    onClick={() => {
                                        setShowQualityPanel(!showQualityPanel);
                                        if (!showQualityPanel) {
                                            generateQualityPreview();
                                        }
                                    }}
                                    style={{
                                        background: showQualityPanel ? "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                        color: "white",
                                        border: "none",
                                        padding: "8px 15px",
                                        borderRadius: "6px",
                                        cursor: "pointer",
                                        fontSize: "12px",
                                        fontWeight: "600",
                                        boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
                                    }}
                                >
                                    🎨 Quality Tools
                                </button>
                                <button onClick={onSaveCropped} className="export-button" title="Ctrl+E">
                                    📷 Export Images
                                </button>
                                <button onClick={onSaveAsZip} className="export-button" title="Ctrl+Z">
                                    📦 Export ZIP
                                </button>
                                <button onClick={onGeneratePDF} className="export-button" title="Ctrl+P">
                                    📄 Export PDF
                                </button>
                            </div>
                        </div>

                        {/* Separator */}
                        <div style={{
                            height: '3px',
                            background: 'linear-gradient(90deg, transparent 0%, #00ffff 20%, #0080ff 40%, #ff00ff 60%, #00ffff 80%, transparent 100%)',
                            margin: '10px 20px',
                            borderRadius: '2px',
                            boxShadow: '0 0 10px rgba(0, 255, 255, 0.5)',
                            overflow: 'hidden'
                        }}></div>

                        <div>
                            <div style={{
                                display: gridView ? "grid" : "flex",
                                gridTemplateColumns: gridView ? `repeat(auto-fit, minmax(${300 * (zoomLevel / 100)}px, 1fr))` : "none",
                                flexWrap: gridView ? "nowrap" : "wrap",
                                gap: "0.5rem",
                                padding: "0.5rem",
                                color: "white",
                                maxWidth: gridView ? "none" : "none",
                                margin: gridView ? "0" : "0",
                                height: gridView ? "calc(100vh - 380px)" : "auto", // Adjusted height to fit content
                                overflowY: gridView ? "auto" : "visible",
                                transform: `scale(${zoomLevel / 100})`,
                                transformOrigin: "top left"
                            }}>
                                {files.length === 0 && (
                                    <About aboutText={aboutText} appName={appName}>
                                        <WelcomePageWithTools onSelectSomeFiles={onSelectSomeFiles} onSelectFolder={onSelectFolder} />
                                    </About>
                                )}
                                {files.length > 0 && (
                                    <>
                                        {files
                                            .map((file, actualIndex) => {
                                                const isSelected = selectedFiles.has(actualIndex);
                                                const isFloating = floatingImages[actualIndex]?.visible;
                                                const isZoomed = zoomedImages.has(actualIndex);
                                            return file && (
                                                <div key={file?.name + actualIndex}
                                                     style={{
                                                         position: "relative",
                                                         border: isSelected ? "3px solid #4CAF50" : rearrangeMode && draggedIndex === actualIndex ? "3px solid #2196F3" : rearrangeMode ? "2px dashed #888" : "none",
                                                         borderRadius: "0.5rem",
                                                         cursor: rearrangeMode ? "grab" : "default",
                                                         opacity: rearrangeMode && draggedIndex === actualIndex ? 0.5 : 1,
                                                         transform: isZoomed ? "scale(1.2)" : "scale(1)",
                                                         transition: "transform 0.3s ease, opacity 0.3s ease",
                                                         background: rearrangeMode ? "rgba(33, 150, 243, 0.1)" : "transparent",
                                                         transformOrigin: "center center",
                                                         zIndex: isZoomed ? 1000 : 1,
                                                         borderBottomLeftRadius: isSelected ? "10px" : "0.5rem", // Custom border for selection
                                                         borderBottomRightRadius: isSelected ? "10px" : "0.5rem",
                                                         borderTopLeftRadius: isSelected ? "10px" : "0.5rem",
                                                         borderTopRightRadius: isSelected ? "10px" : "0.5rem",
                                                     }}
                                                     onMouseDown={(e) => {
                                                         if (!rearrangeMode) {
                                                             handleMouseDown(actualIndex);
                                                         } else {
                                                             setDraggedIndex(actualIndex);
                                                         }
                                                     }}
                                                     onMouseUp={() => {
                                                         if (!rearrangeMode) {
                                                             handleMouseUp();
                                                         } else {
                                                             setDraggedIndex(null);
                                                         }
                                                     }}
                                                     onMouseLeave={() => {
                                                         if (!rearrangeMode) {
                                                             handleMouseUp();
                                                         }
                                                     }}
                                                >
                                                    {isSelected && !rearrangeMode && (
                                                        <div style={{
                                                            position: "absolute",
                                                            top: "5px",
                                                            right: "5px",
                                                            background: "#4CAF50",
                                                            color: "white",
                                                            borderRadius: "50%",
                                                            width: "25px",
                                                            height: "25px",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            zIndex: 100,
                                                            fontSize: "14px"
                                                        }}>
                                                            ✓
                                                        </div>
                                                    )}

                                                    {/* Floating Image Controls (right bottom corner) */}
                                                    <div style={{
                                                        position: "absolute",
                                                        bottom: "5px",
                                                        right: "5px",
                                                        zIndex: 10,
                                                        display: "flex",
                                                        gap: "5px"
                                                    }}>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); toggleFloating(actualIndex); }}
                                                            style={{
                                                                background: isFloating ? "#f44336" : "#2196F3",
                                                                border: "none",
                                                                color: "white",
                                                                padding: "4px 8px",
                                                                borderRadius: "50%",
                                                                cursor: "pointer",
                                                                fontSize: "12px",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                width: "28px",
                                                                height: "28px",
                                                                boxShadow: "0 2px 5px rgba(0,0,0,0.3)"
                                                            }}
                                                            title={isFloating ? "Close Floating Window" : "Open Floating Window"}
                                                        >
                                                            🎈
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); toggleZoom(actualIndex); }}
                                                            style={{
                                                                background: isZoomed ? "#FFEB3B" : "#9C27B0",
                                                                color: isZoomed ? "#333" : "white",
                                                                border: "none",
                                                                padding: "4px 8px",
                                                                borderRadius: "50%",
                                                                cursor: "pointer",
                                                                fontSize: "12px",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                width: "28px",
                                                                height: "28px",
                                                                boxShadow: "0 2px 5px rgba(0,0,0,0.3)"
                                                            }}
                                                            title={isZoomed ? "Unzoom" : "Zoom"}
                                                        >
                                                            🔍
                                                        </button>
                                                    </div>


                                                    {/* Directional Arrow Controls for Rearrange Mode */}
                                                    {rearrangeMode && (
                                                        <div style={{
                                                            position: "absolute",
                                                            top: "50%",
                                                            left: "50%",
                                                            transform: "translate(-50%, -50%)",
                                                            zIndex: 200,
                                                            display: "flex",
                                                            flexDirection: "column",
                                                            alignItems: "center",
                                                            gap: "2px",
                                                            background: "rgba(0, 0, 0, 0.8)",
                                                            borderRadius: "8px",
                                                            padding: "8px",
                                                            border: "2px solid #2196F3"
                                                        }}>
                                                            {/* Up Arrow */}
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    moveImage(actualIndex, 'up');
                                                                }}
                                                                style={{
                                                                    background: "linear-gradient(135deg, #2196F3, #1976D2)",
                                                                    border: "none",
                                                                    color: "white",
                                                                    width: "32px",
                                                                    height: "32px",
                                                                    borderRadius: "6px",
                                                                    cursor: "pointer",
                                                                    fontSize: "16px",
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    justifyContent: "center",
                                                                    boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                                                                    transition: "all 0.2s ease"
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    e.currentTarget.style.transform = "scale(1.1)";
                                                                    e.currentTarget.style.background = "linear-gradient(135deg, #1976D2, #1565C0)";
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    e.currentTarget.style.transform = "scale(1)";
                                                                    e.currentTarget.style.background = "linear-gradient(135deg, #2196F3, #1976D2)";
                                                                }}
                                                                onMouseDown={(e) => {
                                                                    e.currentTarget.style.transform = "scale(0.95)";
                                                                }}
                                                                onMouseUp={(e) => {
                                                                    e.currentTarget.style.transform = "scale(1.1)";
                                                                }}
                                                                title="Move Up"
                                                            >
                                                                ↑
                                                            </button>

                                                            {/* Left and Right Arrows Row */}
                                                            <div style={{ display: "flex", gap: "2px" }}>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        moveImage(actualIndex, 'left');
                                                                    }}
                                                                    style={{
                                                                        background: "linear-gradient(135deg, #2196F3, #1976D2)",
                                                                        border: "none",
                                                                        color: "white",
                                                                        width: "32px",
                                                                        height: "32px",
                                                                        borderRadius: "6px",
                                                                        cursor: "pointer",
                                                                        fontSize: "16px",
                                                                        display: "flex",
                                                                        alignItems: "center",
                                                                        justifyContent: "center",
                                                                        boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                                                                        transition: "all 0.2s ease"
                                                                    }}
                                                                    onMouseEnter={(e) => {
                                                                        e.currentTarget.style.transform = "scale(1.1)";
                                                                        e.currentTarget.style.background = "linear-gradient(135deg, #1976D2, #1565C0)";
                                                                    }}
                                                                    onMouseLeave={(e) => {
                                                                        e.currentTarget.style.transform = "scale(1)";
                                                                        e.currentTarget.style.background = "linear-gradient(135deg, #2196F3, #1976D2)";
                                                                    }}
                                                                    onMouseDown={(e) => {
                                                                        e.currentTarget.style.transform = "scale(0.95)";
                                                                    }}
                                                                    onMouseUp={(e) => {
                                                                        e.currentTarget.style.transform = "scale(1.1)";
                                                                    }}
                                                                    title="Move Left"
                                                                >
                                                                    ←
                                                                </button>

                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        moveImage(actualIndex, 'right');
                                                                    }}
                                                                    style={{
                                                                        background: "linear-gradient(135deg, #2196F3, #1976D2)",
                                                                        border: "none",
                                                                        color: "white",
                                                                        width: "32px",
                                                                        height: "32px",
                                                                        borderRadius: "6px",
                                                                        cursor: "pointer",
                                                                        fontSize: "16px",
                                                                        display: "flex",
                                                                        alignItems: "center",
                                                                        justifyContent: "center",
                                                                        boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                                                                        transition: "all 0.2s ease"
                                                                    }}
                                                                    onMouseEnter={(e) => {
                                                                        e.currentTarget.style.transform = "scale(1.1)";
                                                                        e.currentTarget.style.background = "linear-gradient(135deg, #1976D2, #1565C0)";
                                                                    }}
                                                                    onMouseLeave={(e) => {
                                                                        e.currentTarget.style.transform = "scale(1)";
                                                                        e.currentTarget.style.background = "linear-gradient(135deg, #2196F3, #1976D2)";
                                                                    }}
                                                                    onMouseDown={(e) => {
                                                                        e.currentTarget.style.transform = "scale(0.95)";
                                                                    }}
                                                                    onMouseUp={(e) => {
                                                                        e.currentTarget.style.transform = "scale(1.1)";
                                                                    }}
                                                                    title="Move Right"
                                                                >
                                                                    →
                                                                </button>
                                                            </div>

                                                            {/* Down Arrow */}
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    moveImage(actualIndex, 'down');
                                                                }}
                                                                style={{
                                                                    background: "linear-gradient(135deg, #2196F3, #1976D2)",
                                                                    border: "none",
                                                                    color: "white",
                                                                    width: "32px",
                                                                    height: "32px",
                                                                    borderRadius: "6px",
                                                                    cursor: "pointer",
                                                                    fontSize: "16px",
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    justifyContent: "center",
                                                                    boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                                                                    transition: "all 0.2s ease"
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    e.currentTarget.style.transform = "scale(1.1)";
                                                                    e.currentTarget.style.background = "linear-gradient(135deg, #1976D2, #1565C0)";
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    e.currentTarget.style.transform = "scale(1)";
                                                                    e.currentTarget.style.background = "linear-gradient(135deg, #2196F3, #1976D2)";
                                                                }}
                                                                onMouseDown={(e) => {
                                                                    e.currentTarget.style.transform = "scale(0.95)";
                                                                }}
                                                                onMouseUp={(e) => {
                                                                    e.currentTarget.style.transform = "scale(1.1)";
                                                                }}
                                                                title="Move Down"
                                                            >
                                                                ↓
                                                            </button>
                                                        </div>
                                                    )}
                                                    <div style={{
                                                        pointerEvents: rearrangeMode ? 'none' : 'auto',
                                                        opacity: rearrangeMode ? 0.7 : 1,
                                                        transition: 'opacity 0.3s ease'
                                                    }}>
                                                        <Cropper
                                                            cropSize={cropSize}
                                                            file={file}
                                                            index={actualIndex}
                                                            onSetCropped={onSetCropped}
                                                            onRemoveImage={onRemoveImage}
                                                            crops={crops}
                                                            setCrops={setCrops}
                                                            keepRatio={keepRatio}
                                                            lockMovement={lockMovement}
                                                            centerCrop={centerCrop}
                                                            onGlobalCropChange={onGlobalCropChange}
                                                            rearrangeMode={rearrangeMode}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })
                                        }
                                    </>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* Floating Images */}
                {Object.entries(floatingImages).map(([index, data]) =>
                    data.visible && (
                        <DraggablePanel
                            key={index}
                            title={`Floating Image ${parseInt(index) + 1}`}
                            onClose={() => closeFloatingImage(parseInt(index))}
                            initialPosition={data.position}
                            initialSize={data.size}
                            borderColor="#28a745"
                        >
                            <div style={{ width: '100%', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                {/* Render the image using its dataUrl or a placeholder */}
                                {files[parseInt(index)] ? (
                                    <img
                                        src={files[parseInt(index)] instanceof File ? URL.createObjectURL(files[parseInt(index)]) : files[parseInt(index)].dataUrl}
                                        alt={`Floating ${parseInt(index) + 1}`}
                                        style={{
                                            width: '100%',
                                            height: 'calc(100% - 30px)', // Adjust height to make space for controls
                                            objectFit: 'contain',
                                            borderBottom: '1px solid #eee'
                                        }}
                                        draggable={false}
                                    />
                                ) : (
                                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                                        Image data not available
                                    </div>
                                )}
                                <div style={{ display: 'flex', justifyContent: 'space-around', padding: '5px', height: '30px', background: '#f0f0f0' }}>
                                    <button
                                        onClick={() => toggleZoom(parseInt(index))}
                                        style={{
                                            background: zoomedImages.has(parseInt(index)) ? "#FFEB3B" : "#9C27B0",
                                            color: zoomedImages.has(parseInt(index)) ? "#333" : "white",
                                            border: "none",
                                            padding: "5px 10px",
                                            borderRadius: "5px",
                                            cursor: "pointer"
                                        }}
                                    >
                                        {zoomedImages.has(parseInt(index)) ? 'Unzoom' : 'Zoom'} (🔍)
                                    </button>
                                    {/* Placeholder for future controls if needed */}
                                </div>
                            </div>
                        </DraggablePanel>
                    )
                )}


                {/* Floating Preview Window */}
                {showFloatingPreview && previewImage && (
                    <div
                        style={{
                            position: 'fixed',
                            left: `${previewPosition.x}px`,
                            top: `${previewPosition.y}px`,
                            width: `${previewSize.width}px`,
                            height: `${previewSize.height}px`,
                            background: 'white',
                            border: '2px solid #007bff',
                            borderRadius: '10px',
                            zIndex: 10000,
                            overflow: 'hidden',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                            minWidth: '200px',
                            minHeight: '150px'
                        }}
                    >
                        <div
                            style={{
                                background: '#007bff',
                                color: 'white',
                                padding: '5px 10px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                cursor: 'move',
                                fontSize: '12px'
                            }}
                            onMouseDown={(e) => {
                                if (isResizing) return;
                                const startX = e.clientX - previewPosition.x;
                                const startY = e.clientY - previewPosition.y;

                                const handleMouseMove = (e: MouseEvent) => {
                                    setPreviewPosition({
                                        x: e.clientX - startX,
                                        y: e.clientY - startY
                                    });
                                };

                                const handleMouseUp = () => {
                                    document.removeEventListener('mousemove', handleMouseMove);
                                    document.removeEventListener('mouseup', handleMouseUp);
                                };

                                document.addEventListener('mousemove', handleMouseMove);
                                document.addEventListener('mouseup', handleMouseUp);
                            }}
                        >
                            <span>🖼️ Live Preview ({currentPreviewIndex + 1}/{Object.keys(crops).filter(key => crops[parseInt(key)] && crops[parseInt(key)].width && crops[parseInt(key)].height).length})</span>
                            <div style={{ display: 'flex', gap: '5px' }}>
                                <button
                                    onClick={() => {
                                        if (qualityHistoryIndex > 0) {
                                            undoQualityEffect();
                                        } else {
                                            alert('No changes to undo');
                                        }
                                    }}
                                    disabled={qualityHistoryIndex <= 0}
                                    style={{
                                        background: qualityHistoryIndex > 0 ? '#28a745' : '#6c757d',
                                        color: 'white',
                                        border: 'none',
                                        padding: '4px 8px',
                                        borderRadius: '3px',
                                        cursor: qualityHistoryIndex > 0 ? 'pointer' : 'not-allowed',
                                        fontSize: '12px'
                                    }}
                                    title="Undo last change"
                                >
                                    ↶
                                </button>
                                <button
                                    onClick={() => setShowFloatingPreview(false)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'white',
                                        cursor: 'pointer',
                                        fontSize: '14px'
                                    }}
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                        <div style={{ padding: '10px', height: 'calc(100% - 40px)', overflow: 'hidden', position: 'relative' }}>
                            <img
                                src={previewImage}
                                alt="Floating preview"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'contain'
                                }}
                            />

                            {/* Enhanced Watermark Overlays with Control Points */}
                            {enableWatermark && watermarks.map((watermark) => (
                                <div
                                    key={watermark.id}
                                    style={{
                                        position: 'absolute',
                                        left: `${watermark.position.x}%`,
                                        top: `${watermark.position.y}%`,
                                        width: `${watermark.size.width}px`,
                                        height: `${watermark.size.height}px`,
                                        transform: `translate(-50%, -50%) rotate(${watermark.rotation}deg)`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: `${watermark.fontSize * 0.5}px`, // Scale for preview
                                        fontFamily: watermark.fontFamily,
                                        fontWeight: watermark.isBold ? 'bold' : 'normal',
                                        fontStyle: watermark.isItalic ? 'italic' : 'normal',
                                        color: watermark.textColor,
                                        userSelect: 'none',
                                        zIndex: selectedElement.type === 'watermark' && selectedElement.id === watermark.id ? 1001 : 999,
                                        opacity: watermark.opacity / 100,
                                        transition: 'all 0.3s ease',
                                        pointerEvents: 'none'
                                    }}
                                    onMouseDown={(e) => {
                                        if (!watermark.isMovable || e.button !== 0) return;
                                        
                                        e.preventDefault();
                                        e.stopPropagation();
                                        
                                        const container = e.currentTarget.parentElement!;
                                        const rect = container.getBoundingClientRect();
                                        const startX = e.clientX;
                                        const startY = e.clientY;
                                        const startPos = { ...watermark.position };

                                        const handleMouseMove = (e: MouseEvent) => {
                                            const deltaX = ((e.clientX - startX) / rect.width) * 100;
                                            const deltaY = ((e.clientY - startY) / rect.height) * 100;
                                            
                                            const newPos = {
                                                x: Math.max(5, Math.min(95, startPos.x + deltaX)),
                                                y: Math.max(5, Math.min(95, startPos.y + deltaY))
                                            };
                                            
                                            updateWatermark(watermark.id, { position: newPos });
                                        };

                                        const handleMouseUp = () => {
                                            document.removeEventListener('mousemove', handleMouseMove);
                                            document.removeEventListener('mouseup', handleMouseUp);
                                        };

                                        document.addEventListener('mousemove', handleMouseMove);
                                        document.addEventListener('mouseup', handleMouseUp);
                                    }}
                                >
                                    {watermark.image ? (
                                        <img src={watermark.image} alt="Watermark" style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'contain',
                                            pointerEvents: 'none'
                                        }} />
                                    ) : (
                                        <span style={{ 
                                            textAlign: watermark.textAlign as any, 
                                            pointerEvents: 'none',
                                            width: '100%',
                                            height: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            {watermark.text || 'Watermark'}
                                        </span>
                                    )}
                                    
                                    {/* Control Point */}
                                    <div 
                                        style={{
                                            position: 'absolute',
                                            top: '-8px',
                                            right: '-8px',
                                            width: '16px',
                                            height: '16px',
                                            background: 'linear-gradient(45deg, #00ffff, #0080ff)',
                                            borderRadius: '50%',
                                            border: '2px solid white',
                                            cursor: 'pointer',
                                            boxShadow: '0 2px 8px rgba(0,255,255,0.6)',
                                            pointerEvents: 'auto',
                                            zIndex: 1002,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '8px',
                                            color: 'white',
                                            fontWeight: 'bold'
                                        }}
                                        onClick={(e) => handleElementClick('watermark', watermark.id, e)}
                                        title="Click to control watermark"
                                    >
                                        W
                                    </div>
                                    
                                    {/* Selection indicator */}
                                    {selectedElement.type === 'watermark' && selectedElement.id === watermark.id && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '-8px',
                                            left: '-8px',
                                            width: 'calc(100% + 16px)',
                                            height: 'calc(100% + 16px)',
                                            border: '2px dashed #00ffff',
                                            borderRadius: '4px',
                                            pointerEvents: 'none',
                                            animation: 'pulse 2s infinite'
                                        }} />
                                    )}
                                </div>
                            ))}

                            {/* Enhanced Signature Overlays with Control Points */}
                            {enableSignature && signatures.map((signature) => (
                                <div
                                    key={signature.id}
                                    style={{
                                        position: 'absolute',
                                        left: `${signature.position.x}%`,
                                        top: `${signature.position.y}%`,
                                        width: `${signature.size.width}px`,
                                        height: `${signature.size.height}px`,
                                        transform: `translate(-50%, -50%) rotate(${signature.rotation}deg)`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: `${signature.fontSize * 0.5}px`, // Scale for preview
                                        fontFamily: signature.fontFamily,
                                        fontWeight: signature.isBold ? 'bold' : 'normal',
                                        fontStyle: signature.isItalic ? 'italic' : 'normal',
                                        color: signature.textColor,
                                        userSelect: 'none',
                                        zIndex: selectedElement.type === 'signature' && selectedElement.id === signature.id ? 1001 : 999,
                                        opacity: signature.opacity / 100,
                                        transition: 'all 0.3s ease',
                                        pointerEvents: 'none'
                                    }}
                                    onMouseDown={(e) => {
                                        if (!signature.isMovable || e.button !== 0) return;
                                        
                                        e.preventDefault();
                                        e.stopPropagation();
                                        
                                        const container = e.currentTarget.parentElement!;
                                        const rect = container.getBoundingClientRect();
                                        const startX = e.clientX;
                                        const startY = e.clientY;
                                        const startPos = { ...signature.position };

                                        const handleMouseMove = (e: MouseEvent) => {
                                            const deltaX = ((e.clientX - startX) / rect.width) * 100;
                                            const deltaY = ((e.clientY - startY) / rect.height) * 100;
                                            
                                            const newPos = {
                                                x: Math.max(5, Math.min(95, startPos.x + deltaX)),
                                                y: Math.max(5, Math.min(95, startPos.y + deltaY))
                                            };
                                            
                                            updateSignature(signature.id, { position: newPos });
                                        };

                                        const handleMouseUp = () => {
                                            document.removeEventListener('mousemove', handleMouseMove);
                                            document.removeEventListener('mouseup', handleMouseUp);
                                        };

                                        document.addEventListener('mousemove', handleMouseMove);
                                        document.addEventListener('mouseup', handleMouseUp);
                                    }}
                                >
                                    {signature.image ? (
                                        <img src={signature.image} alt="Signature" style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'contain',
                                            pointerEvents: 'none'
                                        }} />
                                    ) : (
                                        <span style={{ 
                                            textAlign: signature.textAlign as any, 
                                            pointerEvents: 'none',
                                            width: '100%',
                                            height: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            {signature.text || 'Signature'}
                                        </span>
                                    )}
                                    
                                    {/* Control Point */}
                                    <div 
                                        style={{
                                            position: 'absolute',
                                            top: '-8px',
                                            left: '-8px',
                                            width: '16px',
                                            height: '16px',
                                            background: 'linear-gradient(45deg, #ff00ff, #ff8000)',
                                            borderRadius: '50%',
                                            border: '2px solid white',
                                            cursor: 'pointer',
                                            boxShadow: '0 2px 8px rgba(255,0,255,0.6)',
                                            pointerEvents: 'auto',
                                            zIndex: 1002,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '8px',
                                            color: 'white',
                                            fontWeight: 'bold'
                                        }}
                                        onClick={(e) => handleElementClick('signature', signature.id, e)}
                                        title="Click to control signature"
                                    >
                                        S
                                    </div>
                                    
                                    {/* Selection indicator */}
                                    {selectedElement.type === 'signature' && selectedElement.id === signature.id && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '-8px',
                                            left: '-8px',
                                            width: 'calc(100% + 16px)',
                                            height: 'calc(100% + 16px)',
                                            border: '2px dashed #ff00ff',
                                            borderRadius: '4px',
                                            pointerEvents: 'none',
                                            animation: 'pulse 2s infinite'
                                        }} />
                                    )}
                                </div>
                            ))}

                            {/* Navigation Buttons */}
                            {Object.keys(crops).filter(key => crops[parseInt(key)] && crops[parseInt(key)].width && crops[parseInt(key)].height).length > 1 && (
                                <>
                                    {/* Previous Image Button */}
                                    <button
                                        onClick={goToPrevPreviewImage}
                                        style={{
                                            position: 'absolute',
                                            left: '10px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            width: '45px',
                                            height: '45px',
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            border: '3px solid white',
                                            borderRadius: '50%',
                                            color: 'white',
                                            fontSize: '18px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            zIndex: 1000,
                                            fontWeight: 'bold',
                                            userSelect: 'none'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-50%) scale(1.15) rotate(-5deg)';
                                            e.currentTarget.style.background = 'linear-gradient(135deg, #5a6fd8 0%, #6a4c93 100%)';
                                            e.currentTarget.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.6)';
                                            e.currentTarget.style.borderColor = '#FFD700';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-50%) scale(1) rotate(0deg)';
                                            e.currentTarget.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                                            e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
                                            e.currentTarget.style.borderColor = 'white';
                                        }}
                                        onMouseDown={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-50%) scale(0.95)';
                                        }}
                                        onMouseUp={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-50%) scale(1.15) rotate(-5deg)';
                                        }}
                                        title="Previous Image"
                                    >
                                        ◄◄
                                    </button>

                                    {/* Next Image Button */}
                                    <button
                                        onClick={goToNextPreviewImage}
                                        style={{
                                            position: 'absolute',
                                            right: '50px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            width: '45px',
                                            height: '45px',
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            border: '3px solid white',
                                            borderRadius: '50%',
                                            color: 'white',
                                            fontSize: '18px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            zIndex: 1000,
                                            fontWeight: 'bold',
                                            userSelect: 'none'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-50%) scale(1.15) rotate(5deg)';
                                            e.currentTarget.style.background = 'linear-gradient(135deg, #5a6fd8 0%, #6a4c93 100%)';
                                            e.currentTarget.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.6)';
                                            e.currentTarget.style.borderColor = '#FFD700';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-50%) scale(1) rotate(0deg)';
                                            e.currentTarget.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                                            e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
                                            e.currentTarget.style.borderColor = 'white';
                                        }}
                                        onMouseDown={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-50%) scale(0.95)';
                                        }}
                                        onMouseUp={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-50%) scale(1.15) rotate(5deg)';
                                        }}
                                        title="Next Image"
                                    >
                                        ►►
                                    </button>
                                </>
                            )}

                            {/* Resize Handle with Arrow */}
                            <div
                                style={{
                                    position: 'absolute',
                                    bottom: '5px',
                                    right: '5px',
                                    width: '30px',
                                    height: '30px',
                                    background: 'rgba(0, 123, 255, 0.9)',
                                    cursor: 'nw-resize',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontSize: '16px',
                                    border: '2px solid white',
                                    boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
                                    transition: 'all 0.2s ease',
                                    userSelect: 'none'
                                }}
                                onMouseDown={(e) => {
                                    e.stopPropagation();
                                    setIsResizing(true);
                                    const startX = e.clientX;
                                    const startY = e.clientY;
                                    const startWidth = previewSize.width;
                                    const startHeight = previewSize.height;

                                    const handleMouseMove = (e: MouseEvent) => {
                                        const deltaX = e.clientX - startX;
                                        const deltaY = e.clientY - startY;
                                        const newWidth = Math.max(200, startWidth + deltaX);
                                        const newHeight = Math.max(150, startHeight + deltaY);
                                        setPreviewSize({ width: newWidth, height: newHeight });
                                    };

                                    const handleMouseUp = () => {
                                        setIsResizing(false);
                                        document.removeEventListener('mousemove', handleMouseMove);
                                        document.removeEventListener('mouseup', handleMouseUp);
                                    };

                                    document.addEventListener('mousemove', handleMouseMove);
                                    document.addEventListener('mouseup', handleMouseUp);
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'scale(1.1)';
                                    e.currentTarget.style.background = 'rgba(0, 123, 255, 1)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'scale(1)';
                                    e.currentTarget.style.background = 'rgba(0, 123, 255, 0.9)';
                                }}
                                title="Drag to resize preview window"
                            >
                                ⤡
                            </div>
                        </div>
                    </div>
                )}

                {/* Preview Popup Modal */}
                {showPreviewPopup && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'rgba(0, 0, 0, 0.9)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10000
                    }}>
                        <div style={{
                            background: 'white',
                            padding: '20px',
                            borderRadius: '10px',
                            maxWidth: '90%',
                            maxHeight: '90%',
                            position: 'relative',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center'
                        }}>
                            <button
                                onClick={() => setShowPreviewPopup(false)}
                                style={{
                                    position: 'absolute',
                                    top: '10px',
                                    right: '10px',
                                    background: '#ff4444',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '30px',
                                    height: '30px',
                                    cursor: 'pointer',
                                    fontSize: '16px'
                                }}
                            >
                                ✕
                            </button>
                            <h3 style={{ color: 'black', marginBottom: '15px' }}>Quality Tools Preview</h3>
                            <img
                                src={previewImage}
                                alt="Preview with effects"
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '70vh',
                                    objectFit: 'contain',
                                    border: '1px solid #ddd',
                                    borderRadius: '5px'
                                }}
                            />
                            <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                                <button
                                    onClick={() => loadSavedAdjustments(true)}
                                    style={{
                                        background: '#4CAF50',
                                        color: 'white',
                                        border: 'none',
                                        padding: '10px 20px',
                                        borderRadius: '5px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Load Saved Settings
                                </button>
                                <button
                                    onClick={() => setShowPreviewPopup(false)}
                                    style={{
                                        background: '#007bff',
                                        color: 'white',
                                        border: 'none',
                                        padding: '10px 20px',
                                        borderRadius: '5px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Close Preview
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Floating Control Panel */}
                {showControlPanel && selectedElement.type && selectedElement.id && (
                    <DraggablePanel
                        title={`🎛️ ${selectedElement.type === 'watermark' ? 'Watermark' : 'Signature'} Controls`}
                        onClose={() => {
                            setShowControlPanel(false);
                            setSelectedElement({ type: null, id: null });
                        }}
                        initialPosition={controlPanelPosition}
                        initialSize={{ width: 280, height: 400 }}
                        borderColor={selectedElement.type === 'watermark' ? '#00ffff' : '#ff00ff'}
                    >
                        <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {/* Move Toggle Button */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <button
                                    onClick={() => toggleElementMove(selectedElement.type!, selectedElement.id!)}
                                    style={{
                                        background: (() => {
                                            const element = selectedElement.type === 'watermark' 
                                                ? watermarks.find(w => w.id === selectedElement.id)
                                                : signatures.find(s => s.id === selectedElement.id);
                                            return element?.isMovable ? '#4CAF50' : '#2196F3';
                                        })(),
                                        color: 'white',
                                        border: 'none',
                                        padding: '10px 15px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: 'bold',
                                        flex: 1,
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    {(() => {
                                        const element = selectedElement.type === 'watermark' 
                                            ? watermarks.find(w => w.id === selectedElement.id)
                                            : signatures.find(s => s.id === selectedElement.id);
                                        return element?.isMovable ? '🔓 Unlock (Free Move)' : '🔒 Lock Position';
                                    })()}
                                </button>
                            </div>

                            {/* Text Size Control */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                                    📏 Text Size: {(() => {
                                        const element = selectedElement.type === 'watermark' 
                                            ? watermarks.find(w => w.id === selectedElement.id)
                                            : signatures.find(s => s.id === selectedElement.id);
                                        return element?.fontSize || 18;
                                    })()}px
                                </label>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <input
                                        type="range"
                                        min="1"
                                        max="200"
                                        value={(() => {
                                            const element = selectedElement.type === 'watermark' 
                                                ? watermarks.find(w => w.id === selectedElement.id)
                                                : signatures.find(s => s.id === selectedElement.id);
                                            return element?.fontSize || 18;
                                        })()}
                                        onChange={(e) => {
                                            const fontSize = parseInt(e.target.value);
                                            if (selectedElement.type === 'watermark') {
                                                updateWatermark(selectedElement.id!, { fontSize });
                                            } else {
                                                updateSignature(selectedElement.id!, { fontSize });
                                            }
                                        }}
                                        style={{ flex: 1 }}
                                    />
                                    <input
                                        type="number"
                                        min="1"
                                        value={(() => {
                                            const element = selectedElement.type === 'watermark' 
                                                ? watermarks.find(w => w.id === selectedElement.id)
                                                : signatures.find(s => s.id === selectedElement.id);
                                            return element?.fontSize || 18;
                                        })()}
                                        onChange={(e) => {
                                            const fontSize = Math.max(1, parseInt(e.target.value) || 18);
                                            if (selectedElement.type === 'watermark') {
                                                updateWatermark(selectedElement.id!, { fontSize });
                                            } else {
                                                updateSignature(selectedElement.id!, { fontSize });
                                            }
                                        }}
                                        style={{ width: '60px', padding: '4px', border: '1px solid #ddd', borderRadius: '4px' }}
                                    />
                                </div>
                            </div>

                            {/* Image Size Control */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                                    🖼️ Image Width: {(() => {
                                        const element = selectedElement.type === 'watermark' 
                                            ? watermarks.find(w => w.id === selectedElement.id)
                                            : signatures.find(s => s.id === selectedElement.id);
                                        return element?.size.width || 150;
                                    })()}px
                                </label>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <input
                                        type="range"
                                        min="10"
                                        max="800"
                                        value={(() => {
                                            const element = selectedElement.type === 'watermark' 
                                                ? watermarks.find(w => w.id === selectedElement.id)
                                                : signatures.find(s => s.id === selectedElement.id);
                                            return element?.size.width || 150;
                                        })()}
                                        onChange={(e) => {
                                            const width = parseInt(e.target.value);
                                            const currentElement = selectedElement.type === 'watermark' 
                                                ? watermarks.find(w => w.id === selectedElement.id)
                                                : signatures.find(s => s.id === selectedElement.id);
                                            if (currentElement) {
                                                const newSize = { ...currentElement.size, width };
                                                if (selectedElement.type === 'watermark') {
                                                    updateWatermark(selectedElement.id!, { size: newSize });
                                                } else {
                                                    updateSignature(selectedElement.id!, { size: newSize });
                                                }
                                            }
                                        }}
                                        style={{ flex: 1 }}
                                    />
                                    <input
                                        type="number"
                                        min="10"
                                        value={(() => {
                                            const element = selectedElement.type === 'watermark' 
                                                ? watermarks.find(w => w.id === selectedElement.id)
                                                : signatures.find(s => s.id === selectedElement.id);
                                            return element?.size.width || 150;
                                        })()}
                                        onChange={(e) => {
                                            const width = Math.max(10, parseInt(e.target.value) || 150);
                                            const currentElement = selectedElement.type === 'watermark' 
                                                ? watermarks.find(w => w.id === selectedElement.id)
                                                : signatures.find(s => s.id === selectedElement.id);
                                            if (currentElement) {
                                                const newSize = { ...currentElement.size, width };
                                                if (selectedElement.type === 'watermark') {
                                                    updateWatermark(selectedElement.id!, { size: newSize });
                                                } else {
                                                    updateSignature(selectedElement.id!, { size: newSize });
                                                }
                                            }
                                        }}
                                        style={{ width: '70px', padding: '4px', border: '1px solid #ddd', borderRadius: '4px' }}
                                    />
                                </div>
                            </div>

                            {/* Image Height Control */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                                    📐 Image Height: {(() => {
                                        const element = selectedElement.type === 'watermark' 
                                            ? watermarks.find(w => w.id === selectedElement.id)
                                            : signatures.find(s => s.id === selectedElement.id);
                                        return element?.size.height || 50;
                                    })()}px
                                </label>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <input
                                        type="range"
                                        min="10"
                                        max="400"
                                        value={(() => {
                                            const element = selectedElement.type === 'watermark' 
                                                ? watermarks.find(w => w.id === selectedElement.id)
                                                : signatures.find(s => s.id === selectedElement.id);
                                            return element?.size.height || 50;
                                        })()}
                                        onChange={(e) => {
                                            const height = parseInt(e.target.value);
                                            const currentElement = selectedElement.type === 'watermark' 
                                                ? watermarks.find(w => w.id === selectedElement.id)
                                                : signatures.find(s => s.id === selectedElement.id);
                                            if (currentElement) {
                                                const newSize = { ...currentElement.size, height };
                                                if (selectedElement.type === 'watermark') {
                                                    updateWatermark(selectedElement.id!, { size: newSize });
                                                } else {
                                                    updateSignature(selectedElement.id!, { size: newSize });
                                                }
                                            }
                                        }}
                                        style={{ flex: 1 }}
                                    />
                                    <input
                                        type="number"
                                        min="10"
                                        value={(() => {
                                            const element = selectedElement.type === 'watermark' 
                                                ? watermarks.find(w => w.id === selectedElement.id)
                                                : signatures.find(s => s.id === selectedElement.id);
                                            return element?.size.height || 50;
                                        })()}
                                        onChange={(e) => {
                                            const height = Math.max(10, parseInt(e.target.value) || 50);
                                            const currentElement = selectedElement.type === 'watermark' 
                                                ? watermarks.find(w => w.id === selectedElement.id)
                                                : signatures.find(s => s.id === selectedElement.id);
                                            if (currentElement) {
                                                const newSize = { ...currentElement.size, height };
                                                if (selectedElement.type === 'watermark') {
                                                    updateWatermark(selectedElement.id!, { size: newSize });
                                                } else {
                                                    updateSignature(selectedElement.id!, { size: newSize });
                                                }
                                            }
                                        }}
                                        style={{ width: '70px', padding: '4px', border: '1px solid #ddd', borderRadius: '4px' }}
                                    />
                                </div>
                            </div>

                            {/* Rotation Clock Control */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                                    🕐 Rotation: {(() => {
                                        const element = selectedElement.type === 'watermark' 
                                            ? watermarks.find(w => w.id === selectedElement.id)
                                            : signatures.find(s => s.id === selectedElement.id);
                                        return Math.round(element?.rotation || 0);
                                    })()}°
                                </label>
                                {/* Angle Input */}
                                <input
                                    type="number"
                                    min="0"
                                    max="360"
                                    value={(() => {
                                        const element = selectedElement.type === 'watermark' 
                                            ? watermarks.find(w => w.id === selectedElement.id)
                                            : signatures.find(s => s.id === selectedElement.id);
                                        return Math.round(element?.rotation || 0);
                                    })()}
                                    onChange={(e) => {
                                        const angle = Math.max(0, Math.min(360, parseInt(e.target.value) || 0));
                                        rotateElement(selectedElement.type!, selectedElement.id!, angle);
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        marginBottom: '10px',
                                        border: '2px solid #ddd',
                                        borderRadius: '5px',
                                        textAlign: 'center',
                                        fontSize: '14px'
                                    }}
                                    placeholder="Enter angle (0-360)"
                                />
                                <div style={{ 
                                    position: 'relative', 
                                    width: '80px', 
                                    height: '80px', 
                                    margin: '10px auto',
                                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                                    borderRadius: '50%',
                                    border: '3px solid #fff',
                                    boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                                    cursor: 'pointer'
                                }}>
                                    {/* Clock face */}
                                    <div style={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        width: '2px',
                                        height: '30px',
                                        background: '#FFD700',
                                        transformOrigin: 'bottom center',
                                        transform: `translate(-50%, -100%) rotate(${(() => {
                                            const element = selectedElement.type === 'watermark' 
                                                ? watermarks.find(w => w.id === selectedElement.id)
                                                : signatures.find(s => s.id === selectedElement.id);
                                            return element?.rotation || 0;
                                        })()}deg)`,
                                        borderRadius: '2px',
                                        boxShadow: '0 0 5px rgba(0,0,0,0.5)',
                                        transition: 'transform 0.1s ease'
                                    }} />
                                    {/* Center dot */}
                                    <div style={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        width: '8px',
                                        height: '8px',
                                        background: '#FFD700',
                                        borderRadius: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        boxShadow: '0 0 5px rgba(0,0,0,0.5)'
                                    }} />
                                    {/* Hour markers */}
                                    {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(angle => (
                                        <div key={angle} style={{
                                            position: 'absolute',
                                            top: '5px',
                                            left: '50%',
                                            width: '2px',
                                            height: '8px',
                                            background: 'rgba(255,255,255,0.8)',
                                            transformOrigin: 'bottom center',
                                            transform: `translateX(-50%) rotate(${angle}deg)`,
                                            borderRadius: '1px'
                                        }} />
                                    ))}
                                    {/* Invisible overlay for mouse events */}
                                    <div 
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            cursor: 'pointer'
                                        }}
                                        onMouseDown={(e) => {
                                            setIsRotating(true);
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            const centerX = rect.left + rect.width / 2;
                                            const centerY = rect.top + rect.height / 2;

                                            const handleMouseMove = (e: MouseEvent) => {
                                                if (!isRotating) return;
                                                const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI) + 90;
                                                const normalizedAngle = ((angle % 360) + 360) % 360;
                                                rotateElement(selectedElement.type!, selectedElement.id!, normalizedAngle);
                                            };

                                            const handleMouseUp = () => {
                                                setIsRotating(false);
                                                document.removeEventListener('mousemove', handleMouseMove);
                                                document.removeEventListener('mouseup', handleMouseUp);
                                            };

                                            document.addEventListener('mousemove', handleMouseMove);
                                            document.addEventListener('mouseup', handleMouseUp);
                                        }}
                                    />
                                </div>
                                {/* Quick rotation buttons */}
                                <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', marginTop: '10px' }}>
                                    <button onClick={() => rotateElement(selectedElement.type!, selectedElement.id!, 0)} style={{ padding: '5px 10px', fontSize: '12px', background: '#f0f0f0', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}>0°</button>
                                    <button onClick={() => rotateElement(selectedElement.type!, selectedElement.id!, 90)} style={{ padding: '5px 10px', fontSize: '12px', background: '#f0f0f0', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}>90°</button>
                                    <button onClick={() => rotateElement(selectedElement.type!, selectedElement.id!, 180)} style={{ padding: '5px 10px', fontSize: '12px', background: '#f0f0f0', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}>180°</button>
                                    <button onClick={() => rotateElement(selectedElement.type!, selectedElement.id!, 270)} style={{ padding: '5px 10px', fontSize: '12px', background: '#f0f0f0', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}>270°</button>
                                </div>
                            </div>

                            {/* Control Buttons */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                {/* Delete Button */}
                                <button
                                    onClick={() => deleteElement(selectedElement.type!, selectedElement.id!)}
                                    style={{
                                        background: '#f44336',
                                        color: 'white',
                                        border: 'none',
                                        padding: '10px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    🗑️ Delete
                                </button>

                                {/* Edit Button */}
                                <button
                                    onClick={() => openElementEditor(selectedElement.type!, selectedElement.id!)}
                                    style={{
                                        background: '#FF9800',
                                        color: 'white',
                                        border: 'none',
                                        padding: '10px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    ✏️ Edit
                                </button>

                                {/* Import Image Button */}
                                <button
                                    onClick={() => {
                                        if (selectedElement.type === 'watermark') {
                                            importWatermarkImage(selectedElement.id!);
                                        } else {
                                            importSignatureImage(selectedElement.id!);
                                        }
                                    }}
                                    style={{
                                        background: '#2196F3',
                                        color: 'white',
                                        border: 'none',
                                        padding: '10px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    📷 Import
                                </button>

                                {/* Undo Button */}
                                <button
                                    onClick={() => undoElementChange(selectedElement.type!, selectedElement.id!)}
                                    disabled={(() => {
                                        const element = selectedElement.type === 'watermark' 
                                            ? watermarks.find(w => w.id === selectedElement.id)
                                            : signatures.find(s => s.id === selectedElement.id);
                                        return !element?.history || element.history.length === 0;
                                    })()}
                                    style={{
                                        background: (() => {
                                            const element = selectedElement.type === 'watermark' 
                                                ? watermarks.find(w => w.id === selectedElement.id)
                                                : signatures.find(s => s.id === selectedElement.id);
                                            return element?.history && element.history.length > 0 ? '#9C27B0' : '#ccc';
                                        })(),
                                        color: 'white',
                                        border: 'none',
                                        padding: '10px',
                                        borderRadius: '8px',
                                        cursor: (() => {
                                            const element = selectedElement.type === 'watermark' 
                                                ? watermarks.find(w => w.id === selectedElement.id)
                                                : signatures.find(s => s.id === selectedElement.id);
                                            return element?.history && element.history.length > 0 ? 'pointer' : 'not-allowed';
                                        })(),
                                        fontSize: '12px',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    ↶ Undo
                                </button>

                                {/* Opacity Control */}
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                                        💧 Opacity: {(() => {
                                            const element = selectedElement.type === 'watermark' 
                                                ? watermarks.find(w => w.id === selectedElement.id)
                                                : signatures.find(s => s.id === selectedElement.id);
                                            return element?.opacity || 100;
                                        })()}%
                                    </label>
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                        <input
                                            type="range"
                                            min="1"
                                            max="100"
                                            value={(() => {
                                                const element = selectedElement.type === 'watermark' 
                                                    ? watermarks.find(w => w.id === selectedElement.id)
                                                    : signatures.find(s => s.id === selectedElement.id);
                                                return element?.opacity || 100;
                                            })()}
                                            onChange={(e) => {
                                                const opacity = parseInt(e.target.value);
                                                if (selectedElement.type === 'watermark') {
                                                    updateWatermark(selectedElement.id!, { opacity });
                                                } else {
                                                    updateSignature(selectedElement.id!, { opacity });
                                                }
                                            }}
                                            style={{ flex: 1 }}
                                        />
                                        <input
                                            type="number"
                                            min="1"
                                            max="100"
                                            value={(() => {
                                                const element = selectedElement.type === 'watermark' 
                                                    ? watermarks.find(w => w.id === selectedElement.id)
                                                    : signatures.find(s => s.id === selectedElement.id);
                                                return element?.opacity || 100;
                                            })()}
                                            onChange={(e) => {
                                                const opacity = Math.max(1, Math.min(100, parseInt(e.target.value) || 100));
                                                if (selectedElement.type === 'watermark') {
                                                    updateWatermark(selectedElement.id!, { opacity });
                                                } else {
                                                    updateSignature(selectedElement.id!, { opacity });
                                                }
                                            }}
                                            style={{ width: '60px', padding: '4px', border: '1px solid #ddd', borderRadius: '4px' }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </DraggablePanel>
                )}

                {Object.values(croppedImages).map(
                    (croppedImage) =>
                        croppedImage && <img key={croppedImage as any} src={croppedImage as any} alt="uploaded" style={{display: "none"}}></img>
                )}

                {/* Quality Tools Panel */}
                {showQualityPanel && (
                    <>
                        <QualityPanel
                            showAdjustments={showAdjustments}
                            onToggleAdjustments={() => setShowAdjustments(!showAdjustments)}
                            showEffects={showEffects}
                            onToggleEffects={() => setShowEffects(!showEffects)}
                            onSharePDF={handleSharePDF}
                            darkMode={darkMode}
                            onToggleDarkMode={() => setDarkMode(!darkMode)}
                            onAddWatermark={handleAddWatermark}
                            onAddBorder={() => setShowAdvancedBorderEditor(true)} // Button to open advanced editor
                            onAddSignature={handleAddSignature}
                            onShowPreview={handleShowPreview}
                            onSaveAdjustments={handleSaveAdjustments}
                            onUndoAdjustments={handleUndoAdjustments}
                            enableWatermark={enableWatermark}
                            onToggleWatermark={() => setEnableWatermark(!enableWatermark)}
                            enableBorder={enableBorder}
                            onToggleBorder={() => setEnableBorder(!enableBorder)}
                            enableSignature={enableSignature}
                            onToggleSignature={() => setEnableSignature(!enableSignature)}
                            watermarkOpacity={watermarkOpacity}
                            onWatermarkOpacityChange={(value: number) => setWatermarkOpacity(value)}
                            signatureOpacity={signatureOpacity}
                            onSignatureOpacityChange={(value: number) => setSignatureOpacity(value)}
                        />

                        {/* Adjustments Panel Overlay */}
                        {showAdjustments && (
                            <DraggablePanel
                                title="🎛️ Image Adjustments"
                                onClose={() => setShowAdjustments(false)}
                                initialPosition={{ x: 50, y: 50 }}
                                initialSize={{ width: 350, height: 600 }}
                                borderColor="#28a745"
                            >
                                <AdjustmentsPanel
                                    onAdjustmentChange={setAdjustmentValues}
                                    onReset={() => setAdjustmentValues(null)}
                                    showComparison={showComparison}
                                    onToggleComparison={() => setShowComparison(!showComparison)}
                                />
                            </DraggablePanel>
                        )}

                        {/* Effects Panel Overlay */}
                        {showEffects && (
                            <DraggablePanel
                                title="🎨 Effect Filters"
                                onClose={() => setShowEffects(false)}
                                initialPosition={{ x: window.innerWidth - 350, y: 50 }}
                                initialSize={{ width: 300, height: 500 }}
                                borderColor="#f5576c"
                            >
                                <EffectFilters
                                    onFilterSelect={setSelectedFilter}
                                    selectedFilter={selectedFilter}
                                />
                            </DraggablePanel>
                        )}

                        {/* Advanced Border Editor Panel */}
                        {showAdvancedBorderEditor && (
                            <DraggablePanel
                                title="🖼️ Advanced Border Editor"
                                onClose={() => setShowAdvancedBorderEditor(false)}
                                initialPosition={{ x: window.innerWidth - 400, y: 100 }}
                                initialSize={{ width: 380, height: 600 }}
                                borderColor="#9C27B0"
                            >
                                <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    {/* Enable Border Toggle */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <input 
                                            type="checkbox" 
                                            checked={enableBorder} 
                                            onChange={(e) => setEnableBorder(e.target.checked)} 
                                        />
                                        <label style={{ fontWeight: 'bold', color: '#333' }}>Enable Border</label>
                                    </div>

                                    {enableBorder && (
                                        <>
                                            {/* Border Width */}
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                                                    Border Width: {borderWidth}px
                                                </label>
                                                <input
                                                    type="range"
                                                    min="1"
                                                    max="50"
                                                    value={borderWidth}
                                                    onChange={(e) => setBorderWidth(parseInt(e.target.value))}
                                                    style={{ width: '100%' }}
                                                />
                                            </div>

                                            {/* Border Color */}
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                                                    Border Color
                                                </label>
                                                <input
                                                    type="color"
                                                    value={borderColor}
                                                    onChange={(e) => setBorderColor(e.target.value)}
                                                    style={{ width: '100%', height: '40px', border: 'none', borderRadius: '5px' }}
                                                />
                                            </div>

                                            {/* Border Style */}
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                                                    Border Style
                                                </label>
                                                <select
                                                    value={borderStyle}
                                                    onChange={(e) => setBorderStyle(e.target.value)}
                                                    style={{ width: '100%', padding: '8px', border: '2px solid #ddd', borderRadius: '5px' }}
                                                >
                                                    {BORDER_STYLES.map(style => (
                                                        <option key={style} value={style}>{style}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Border Radius */}
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                                                    Border Radius: {borderRadius}px
                                                </label>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="50"
                                                    value={borderRadius}
                                                    onChange={(e) => setBorderRadius(parseInt(e.target.value))}
                                                    style={{ width: '100%' }}
                                                />
                                            </div>

                                            {/* Border Shadow */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={borderShadow} 
                                                    onChange={(e) => setBorderShadow(e.target.checked)} 
                                                />
                                                <label style={{ fontWeight: 'bold', color: '#333' }}>Add Shadow Effect</label>
                                            </div>

                                            {/* Border Animation */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={borderAnimation} 
                                                    onChange={(e) => setBorderAnimation(e.target.checked)} 
                                                />
                                                <label style={{ fontWeight: 'bold', color: '#333' }}>Animated Border</label>
                                            </div>

                                            {/* Quick Presets */}
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                                                    Quick Presets
                                                </label>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                                    <button 
                                                        onClick={() => {
                                                            setBorderWidth(5);
                                                            setBorderColor('#000000');
                                                            setBorderStyle('solid');
                                                            setBorderRadius(0);
                                                        }}
                                                        style={{ padding: '8px', background: '#f0f0f0', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}
                                                    >
                                                        Classic
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            setBorderWidth(8);
                                                            setBorderColor('#FFD700');
                                                            setBorderStyle('groove');
                                                            setBorderRadius(10);
                                                        }}
                                                        style={{ padding: '8px', background: '#f0f0f0', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}
                                                    >
                                                        Gold Frame
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            setBorderWidth(3);
                                                            setBorderColor('#2196F3');
                                                            setBorderStyle('dashed');
                                                            setBorderRadius(15);
                                                        }}
                                                        style={{ padding: '8px', background: '#f0f0f0', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}
                                                    >
                                                        Modern
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            setBorderWidth(12);
                                                            setBorderColor('#8B4513');
                                                            setBorderStyle('ridge');
                                                            setBorderRadius(5);
                                                        }}
                                                        style={{ padding: '8px', background: '#f0f0f0', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}
                                                    >
                                                        Vintage
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Import Border Pattern */}
                                            <button
                                                onClick={handleImportBorder}
                                                style={{
                                                    background: '#2196F3',
                                                    color: 'white',
                                                    border: 'none',
                                                    padding: '12px',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    fontSize: '14px',
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                📷 Import Custom Border Pattern
                                            </button>
                                        </>
                                    )}
                                </div>
                            </DraggablePanel>
                        )}

                        {/* Live Preview Panel */}
                        <div style={{
                            position: 'fixed',
                            bottom: '20px',
                            left: '20px',
                            width: '280px',
                            background: 'white',
                            border: '2px solid #007bff',
                            borderRadius: '10px',
                            zIndex: 1001,
                            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                            padding: '15px'
                        }}>
                            <div style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "10px"
                            }}>
                                <h3 style={{margin: 0, fontSize: "14px", color: "#333"}}>🖼️ Live Preview</h3>
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    <button
                                        onClick={() => setShowFloatingPreview(!showFloatingPreview)}
                                        style={{
                                            background: "#007bff",
                                            color: "white",
                                            border: "none",
                                            padding: "5px 8px",
                                            borderRadius: "3px",
                                            cursor: "pointer",
                                            fontSize: "10px"
                                        }}
                                    >
                                        {showFloatingPreview ? '📌' : '🔄'}
                                    </button>
                                    <button
                                        onClick={generateQualityPreview}
                                        style={{
                                            background: "#4CAF50",
                                            color: "white",
                                            border: "none",
                                            padding: "5px 8px",
                                            borderRadius: "3px",
                                            cursor: "pointer",
                                            fontSize: "10px"
                                        }}
                                    >
                                        🔄
                                    </button>
                                </div>
                            </div>
                            <div className="preview-content">
                                {Object.keys(crops).filter(key => crops[parseInt(key)] && crops[parseInt(key)].width && crops[parseInt(key)].height).length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '15px', color: '#666', fontSize: '12px' }}>
                                        <p>⚠️ First crop some images</p>
                                        <p>to see preview here</p>
                                    </div>
                                ) : previewImage ? (
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{
                                            position: 'relative',
                                            display: 'inline-block',
                                            width: '100%',
                                            height: '120px',
                                            border: '1px solid #ddd',
                                            borderRadius: '5px',
                                            overflow: 'hidden'
                                        }}>
                                            <img
                                                src={previewImage}
                                                alt="Preview"
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'contain'
                                                }}
                                                draggable={false}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', gap: '5px', marginTop: '8px' }}>
                                            <button
                                                onClick={() => handleSaveAdjustments(true)}
                                                style={{
                                                    flex: 1,
                                                    background: '#4CAF50',
                                                    color: 'white',
                                                    border: "none",
                                                    padding: "8px",
                                                    borderRadius: "3px",
                                                    cursor: "pointer",
                                                    fontSize: "11px",
                                                    fontWeight: "bold"
                                                }}
                                            >
                                                💾 Apply All
                                            </button>
                                            {Object.keys(originalCroppedImages).length > 0 && (
                                                <button
                                                    onClick={handleUndoAdjustments}
                                                    style={{
                                                        flex: 1,
                                                        background: '#f44336',
                                                        color: 'white',
                                                        border: "none",
                                                        padding: "8px",
                                                        borderRadius: "3px",
                                                        cursor: "pointer",
                                                        fontSize: '11px',
                                                        fontWeight: "bold"
                                                    }}
                                                >
                                                    ↺ Undo
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '15px', color: '#666', fontSize: '12px' }}>
                                        <p>🔄 Generating preview...</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* Text Editor Popups */}
                {showWatermarkEditor && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'rgba(0, 0, 0, 0.8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10001
                    }}>
                        <div style={{
                            background: 'white',
                            padding: '30px',
                            borderRadius: '15px',
                            width: '500px',
                            maxHeight: '80vh',
                            overflowY: 'auto',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                        }}>
                            <h3 style={{ marginTop: 0, color: '#333', textAlign: 'center' }}>🎨 Watermark Text Editor</h3>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>Text:</label>
                                <input
                                    type="text"
                                    value={watermarkText}
                                    onChange={(e) => setWatermarkText(e.target.value)}
                                    style={{ width: '100%', padding: '10px', border: '2px solid #ddd', borderRadius: '5px', fontSize: '16px' }}
                                    placeholder="Enter watermark text..."
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>Font Size:</label>
                                    <input
                                        type="range"
                                        min="12"
                                        max="72"
                                        value={watermarkFontSize}
                                        onChange={(e) => setWatermarkFontSize(parseInt(e.target.value))}
                                        style={{ width: '100%' }}
                                    />
                                    <span style={{ fontSize: '12px', color: '#666' }}>{watermarkFontSize}px</span>
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>Font Family:</label>
                                    <select
                                        value={watermarkFontFamily}
                                        onChange={(e) => setWatermarkFontFamily(e.target.value)}
                                        style={{ width: '100%', padding: '8px', border: '2px solid #ddd', borderRadius: '5px' }}
                                    >
                                        <option value="Arial">Arial</option>
                                        <option value="Times New Roman">Times New Roman</option>
                                        <option value="Helvetica">Helvetica</option>
                                        <option value="Georgia">Georgia</option>
                                        <option value="Verdana">Verdana</option>
                                        <option value="cursive">Cursive</option>
                                        <option value="monospace">Monospace</option>
                                        <option value="serif">Serif</option>
                                        <option value="sans-serif">Sans-serif</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                                <div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={watermarkIsBold}
                                            onChange={(e) => setWatermarkIsBold(e.target.checked)}
                                        />
                                        <strong>Bold</strong>
                                    </label>
                                </div>

                                <div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={watermarkIsItalic}
                                            onChange={(e) => setWatermarkIsItalic(e.target.checked)}
                                        />
                                        <em>Italic</em>
                                    </label>
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>Color:</label>
                                    <input
                                        type="color"
                                        value={watermarkTextColor}
                                        onChange={(e) => setWatermarkTextColor(e.target.value)}
                                        style={{ width: '100%', height: '40px', border: 'none', borderRadius: '5px' }}
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>Text Align:</label>
                                <select
                                    value={watermarkTextAlign}
                                    onChange={(e) => setWatermarkTextAlign(e.target.value)}
                                    style={{ width: '100%', padding: '8px', border: '2px solid #ddd', borderRadius: '5px' }}
                                >
                                    <option value="left">Left</option>
                                    <option value="center">Center</option>
                                    <option value="right">Right</option>
                                </select>
                            </div>

                            {/* Live Preview */}
                            <div style={{
                                border: '2px solid #ddd',
                                borderRadius: '8px',
                                padding: '20px',
                                marginBottom: '20px',
                                background: '#f8f9fa',
                                textAlign: 'center'
                            }}>
                                <h4 style={{ margin: '0 0 10px 0', color: '#666' }}>Live Preview:</h4>
                                <div style={{
                                    fontSize: `${watermarkFontSize}px`,
                                    fontFamily: watermarkFontFamily,
                                    fontWeight: watermarkIsBold ? 'bold' : 'normal',
                                    fontStyle: watermarkIsItalic ? 'italic' : 'normal',
                                    textAlign: watermarkTextAlign as any,
                                    color: watermarkTextColor,
                                    padding: '10px',
                                    background: 'white',
                                    borderRadius: '5px',
                                    border: '1px solid #ddd'
                                }}>
                                    {watermarkText || 'Sample Text'}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                <button
                                    onClick={() => {
                                        // Apply changes to the selected watermark
                                        if (selectedElementForEdit.type === 'watermark' && selectedElementForEdit.id) {
                                            updateWatermark(selectedElementForEdit.id, {
                                                text: watermarkText,
                                                fontSize: watermarkFontSize,
                                                fontFamily: watermarkFontFamily,
                                                isBold: watermarkIsBold,
                                                isItalic: watermarkIsItalic,
                                                textAlign: watermarkTextAlign,
                                                textColor: watermarkTextColor
                                            });
                                        } else {
                                            // Update first watermark if no specific one selected
                                            if (watermarks.length > 0) {
                                                updateWatermark(watermarks[0].id, {
                                                    text: watermarkText,
                                                    fontSize: watermarkFontSize,
                                                    fontFamily: watermarkFontFamily,
                                                    isBold: watermarkIsBold,
                                                    isItalic: watermarkIsItalic,
                                                    textAlign: watermarkTextAlign,
                                                    textColor: watermarkTextColor
                                                });
                                            }
                                        }
                                        setShowWatermarkEditor(false);
                                        setSelectedElementForEdit({ type: null, id: null });
                                    }}
                                    style={{
                                        background: '#4CAF50',
                                        color: 'white',
                                        border: 'none',
                                        padding: '12px 24px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '16px',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    ✓ Apply Changes
                                </button>
                                <button
                                    onClick={() => {
                                        setShowWatermarkEditor(false);
                                        setSelectedElementForEdit({ type: null, id: null });
                                    }}
                                    style={{
                                        background: '#f44336',
                                        color: 'white',
                                        border: 'none',
                                        padding: '12px 24px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '16px'
                                    }}
                                >
                                    ✕ Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {showSignatureEditor && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'rgba(0, 0, 0, 0.8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10001
                    }}>
                        <div style={{
                            background: 'white',
                            padding: '30px',
                            borderRadius: '15px',
                            width: '500px',
                            maxHeight: '80vh',
                            overflowY: 'auto',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                        }}>
                            <h3 style={{ marginTop: 0, color: '#333', textAlign: 'center' }}>✍️ Signature Text Editor</h3>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>Text:</label>
                                <input
                                    type="text"
                                    value={signatureText}
                                    onChange={(e) => setSignatureText(e.target.value)}
                                    style={{ width: '100%', padding: '10px', border: '2px solid #ddd', borderRadius: '5px', fontSize: '16px' }}
                                    placeholder="Enter signature text..."
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>Font Size:</label>
                                    <input
                                        type="range"
                                        min="10"
                                        max="48"
                                        value={signatureFontSize}
                                        onChange={(e) => setSignatureFontSize(parseInt(e.target.value))}
                                        style={{ width: '100%' }}
                                    />
                                    <span style={{ fontSize: '12px', color: '#666' }}>{signatureFontSize}px</span>
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>Font Family:</label>
                                    <select
                                        value={signatureFontFamily}
                                        onChange={(e) => setSignatureFontFamily(e.target.value)}
                                        style={{ width: '100%', padding: '8px', border: '2px solid #ddd', borderRadius: '5px' }}
                                    >
                                        <option value="cursive">Cursive</option>
                                        <option value="Arial">Arial</option>
                                        <option value="Times New Roman">Times New Roman</option>
                                        <option value="Helvetica">Helvetica</option>
                                        <option value="Georgia">Georgia</option>
                                        <option value="Verdana">Verdana</option>
                                        <option value="monospace">Monospace</option>
                                        <option value="serif">Serif</option>
                                        <option value="sans-serif">Sans-serif</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                                <div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={signatureIsBold}
                                            onChange={(e) => setSignatureIsBold(e.target.checked)}
                                        />
                                        <strong>Bold</strong>
                                    </label>
                                </div>

                                <div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={signatureIsItalic}
                                            onChange={(e) => setSignatureIsItalic(e.target.checked)}
                                        />
                                        <em>Italic</em>
                                    </label>
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>Color:</label>
                                    <input
                                        type="color"
                                        value={signatureTextColor}
                                        onChange={(e) => setSignatureTextColor(e.target.value)}
                                        style={{ width: '100%', height: '40px', border: 'none', borderRadius: '5px' }}
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>Text Align:</label>
                                <select
                                    value={signatureTextAlign}
                                    onChange={(e) => setSignatureTextAlign(e.target.value)}
                                    style={{ width: '100%', padding: '8px', border: '2px solid #ddd', borderRadius: '5px' }}
                                >
                                    <option value="left">Left</option>
                                    <option value="center">Center</option>
                                    <option value="right">Right</option>
                                </select>
                            </div>

                            {/* Live Preview */}
                            <div style={{
                                border: '2px solid #ddd',
                                borderRadius: '8px',
                                padding: '20px',
                                marginBottom: '20px',
                                background: '#f8f9fa',
                                textAlign: 'center'
                            }}>
                                <h4 style={{ margin: '0 0 10px 0', color: '#666' }}>Live Preview:</h4>
                                <div style={{
                                    fontSize: `${signatureFontSize}px`,
                                    fontFamily: signatureFontFamily,
                                    fontWeight: signatureIsBold ? 'bold' : 'normal',
                                    fontStyle: signatureIsItalic ? 'italic' : 'normal',
                                    textAlign: signatureTextAlign as any,
                                    color: signatureTextColor,
                                    padding: '10px',
                                    background: 'white',
                                    borderRadius: '5px',
                                    border: '1px solid #ddd'
                                }}>
                                    {signatureText || 'Sample Signature'}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                <button
                                    onClick={() => {
                                        // Apply changes to the selected signature
                                        if (selectedElementForEdit.type === 'signature' && selectedElementForEdit.id) {
                                            updateSignature(selectedElementForEdit.id, {
                                                text: signatureText,
                                                fontSize: signatureFontSize,
                                                fontFamily: signatureFontFamily,
                                                isBold: signatureIsBold,
                                                isItalic: signatureIsItalic,
                                                textAlign: signatureTextAlign,
                                                textColor: signatureTextColor
                                            });
                                        } else {
                                            // Update first signature if no specific one selected
                                            if (signatures.length > 0) {
                                                updateSignature(signatures[0].id, {
                                                    text: signatureText,
                                                    fontSize: signatureFontSize,
                                                    fontFamily: signatureFontFamily,
                                                    isBold: signatureIsBold,
                                                    isItalic: signatureIsItalic,
                                                    textAlign: signatureTextAlign,
                                                    textColor: signatureTextColor
                                                });
                                            }
                                        }
                                        setShowSignatureEditor(false);
                                        setSelectedElementForEdit({ type: null, id: null });
                                    }}
                                    style={{
                                        background: '#4CAF50',
                                        color: 'white',
                                        border: 'none',
                                        padding: '12px 24px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '16px',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    ✓ Apply Changes
                                </button>
                                <button
                                    onClick={() => {
                                        setShowSignatureEditor(false);
                                        setSelectedElementForEdit({ type: null, id: null });
                                    }}
                                    style={{
                                        background: '#f44336',
                                        color: 'white',
                                        border: 'none',
                                        padding: '12px 24px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '16px'
                                    }}
                                >
                                    ✕ Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Advanced Border Editor */}
                {showAdvancedBorderEditor && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'rgba(0, 0, 0, 0.8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10001
                    }}>
                        <div style={{
                            background: 'white',
                            padding: '30px',
                            borderRadius: '15px',
                            width: '600px',
                            maxHeight: '80vh',
                            overflowY: 'auto',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                        }}>
                            <h3 style={{ marginTop: 0, color: '#333', textAlign: 'center' }}>🖼️ Advanced Border Editor</h3>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>Width:</label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="50"
                                        value={borderWidth}
                                        onChange={(e) => setBorderWidth(parseInt(e.target.value))}
                                        style={{ width: '100%' }}
                                    />
                                    <span style={{ fontSize: '12px', color: '#666' }}>{borderWidth}px</span>
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>Style:</label>
                                    <select
                                        value={borderStyle}
                                        onChange={(e) => setBorderStyle(e.target.value as any)}
                                        style={{ width: '100%', padding: '8px', border: '2px solid #ddd', borderRadius: '5px' }}
                                    >
                                        <option value="solid">Solid</option>
                                        <option value="dashed">Dashed</option>
                                        <option value="dotted">Dotted</option>
                                        <option value="double">Double</option>
                                        <option value="groove">Groove (3D)</option>
                                        <option value="ridge">Ridge (3D)</option>
                                        <option value="inset">Inset (3D)</option>
                                        <option value="outset">Outset (3D)</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>Color:</label>
                                    <input
                                        type="color"
                                        value={borderColor}
                                        onChange={(e) => setBorderColor(e.target.value)}
                                        style={{ width: '100%', height: '40px', border: 'none', borderRadius: '5px' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>Corner Radius:</label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="50"
                                        value={borderRadius}
                                        onChange={(e) => setBorderRadius(parseInt(e.target.value))}
                                        style={{ width: '100%' }}
                                    />
                                    <span style={{ fontSize: '12px', color: '#666' }}>{borderRadius}px</span>
                                </div>
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>Gradient Colors (comma-separated):</label>
                                <input
                                    type="text"
                                    value={borderGradient}
                                    onChange={(e) => setBorderGradient(e.target.value)}
                                    style={{ width: '100%', padding: '10px', border: '2px solid #ddd', borderRadius: '5px' }}
                                    placeholder="e.g., #ff0000, #00ff00, #0000ff"
                                />
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={borderShadow}
                                        onChange={(e) => setBorderShadow(e.target.checked)}
                                    />
                                    <span>Add Shadow Effect</span>
                                </label>
                            </div>

                            {/* Live Preview */}
                            <div style={{
                                border: '2px solid #ddd',
                                borderRadius: '8px',
                                padding: '20px',
                                marginBottom: '20px',
                                background: '#f8f9fa',
                                textAlign: 'center'
                            }}>
                                <h4 style={{ margin: '0 0 10px 0', color: '#666' }}>Live Preview:</h4>
                                <div style={{
                                    width: '200px',
                                    height: '150px',
                                    margin: '0 auto',
                                    background: 'linear-gradient(45deg, #667eea, #764ba2)',
                                    borderWidth: borderWidth + 'px',
                                    borderStyle: borderStyle,
                                    borderColor: borderGradient ? 'transparent' : borderColor,
                                    borderRadius: borderRadius + 'px',
                                    borderImage: borderGradient ? `linear-gradient(45deg, ${borderGradient}) 1` : 'none',
                                    boxShadow: borderShadow ? `${borderWidth/2}px ${borderWidth/2}px ${borderWidth}px rgba(0,0,0,0.5)` : 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontWeight: 'bold'
                                }}>
                                    Sample Image
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                <button
                                    onClick={() => {
                                        setEnableBorder(true);
                                        setShowAdvancedBorderEditor(false);
                                        savePreviewState(); // Save state before applying
                                    }}
                                    style={{
                                        background: '#4CAF50',
                                        color: 'white',
                                        border: 'none',
                                        padding: '12px 24px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '16px',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    ✓ Apply Border
                                </button>
                                <button
                                    onClick={() => setShowAdvancedBorderEditor(false)}
                                    style={{
                                        background: '#f44336',
                                        color: 'white',
                                        border: 'none',
                                        padding: '12px 24px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '16px'
                                    }}
                                >
                                    ✕ Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* PDF Master Component */}
                <PDFMaster 
                    isVisible={showPDFMaster}
                    onClose={() => {
                        setShowPDFMaster(false);
                        setCurrentMode('cropper');
                    }}
                />

                {/* MolView Component */}
                <MolView 
                    isVisible={showMolView}
                    onClose={() => {
                        setShowMolView(false);
                        setCurrentMode('cropper');
                    }}
                />

            </>
        </div>
    );
}

export default Main;
