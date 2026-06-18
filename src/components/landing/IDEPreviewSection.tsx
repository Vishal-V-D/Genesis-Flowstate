"use client";

import React, { useState } from 'react';
import { Terminal, Cpu, Database, Activity, Code, Layers, Settings, Play, Search, GitBranch, ShieldCheck, Users } from 'lucide-react';

export default function IDEPreviewSection() {
    // Vibe Coding Workspace Preview States
    const [activeFileIndex, setActiveFileIndex] = useState(0);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisLogs, setAnalysisLogs] = useState<string[]>([
        "[system] Connected to active visual whiteboard AST.",
        "[system] Ready. Click 'Compile & Validate' to synthesize code targets."
    ]);
    const [isPreviewMode, setIsPreviewMode] = useState(false);

    const codeFiles = [
        {
            name: "main.tf",
            lang: "hcl",
            category: "Infrastructure",
            target: "Terraform",
            content: `resource "aws_lb" "ingress_alb" {
  name               = "prod-ingress-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]
  subnets            = var.public_subnet_ids
}

resource "aws_dynamodb_table" "persistence" {
  name           = "flowstate_persistent_store"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "pk"
  range_key      = "sk"

  attribute {
    name = "pk"
    type = "S"
  }
}`
        },
        {
            name: "schema.prisma",
            lang: "prisma",
            category: "Database",
            target: "Prisma Schema",
            content: `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  role      String   @default("viewer")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model WorkspaceState {
  id        String   @id @default(uuid())
  nodes     Json
  edges     Json
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}`
        },
        {
            name: "deploy.yml",
            lang: "yaml",
            category: "CI/CD Workflow",
            target: "GitHub Actions",
            content: `name: FlowState IaC Compile & Audit
on:
  push:
    branches: [ main ]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2
      - name: Terraform Plan & Security Audit
        run: terraform plan`
        },
        {
            name: "architecture.md",
            lang: "markdown",
            category: "Architecture Doc",
            target: "System Design",
            content: `# Architecture Design: FlowState Stack
This document describes the high-availability configuration compiled from the visual workspace canvas.

## Network Topology
- **Internet Ingress**: Public Application Load Balancer
- **Service Mesh**: ECS / FastAPI WebSocket Gateway
- **Data Persistence**: DynamoDB Cluster (Global Tables enabled)`
        },
        {
            name: "threat_model.md",
            lang: "markdown",
            category: "Compliance Doc",
            target: "Threat Model",
            content: `# Threat Modeling Analysis
Automatically compiled by the FlowState security analyzer.

## Identified Risks & Mitigations
1. **Unencrypted DB Writes**
   - *Impact*: High
   - *Mitigation*: DynamoDB table configured with AWS Managed Customer Key (SSE-KMS).
2. **Permissive ALB SGs**
   - *Impact*: Critical
   - *Mitigation*: Ingress limited strictly to HTTP/HTTPS ports.`
        }
    ];

    const triggerValidation = () => {
        if (isAnalyzing) return;
        setIsAnalyzing(true);
        setAnalysisLogs([
            "[compiler] Initializing compilation run for workspace graph...",
        ]);

        const pipelineSteps = [
            "[compiler] Parsing 3 whiteboard layout nodes and 4 connection links.",
            "[parser] S3 bucket policies compiled. Zero-Trust Cognito auth enabled.",
            "[generator] Synthesizing Terraform HCL output (main.tf)...",
            "[generator] Translating database objects to Prisma models (schema.prisma)...",
            "[auditor] Running static security analysis & threat modeling check...",
            "[auditor] No permissive rules found. Security audit checks: PASS.",
            "[compiler] Compilation target directories written successfully."
        ];

        pipelineSteps.forEach((stepText, idx) => {
            setTimeout(() => {
                setAnalysisLogs(prev => [...prev, stepText]);
                if (idx === pipelineSteps.length - 1) {
                    setIsAnalyzing(false);
                }
            }, (idx + 1) * 500);
        });
    };

    return (
        <section id="features" className="py-24 px-6 relative z-40 border-b border-white/[0.05]">
            <div className="max-w-6xl mx-auto relative z-10">
                <div className="text-center mb-12">
                    <div className="flex justify-center mb-4"><span className="px-3 py-1 text-[10px] sm:text-xs font-mono font-bold tracking-widest uppercase rounded-full bg-white/10 text-white border border-white/20 backdrop-blur-md shadow-lg">VIBE CODING ENVIRONMENT</span></div>
                    <h3 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
                        A workspace that moves as fast as you think
                    </h3>
                    <p className="text-sm text-gray-400 max-w-2xl mx-auto leading-relaxed">
                        Say goodbye to context switching. FlowState offers a fully-integrated browser IDE experience. Review multi-language targets, run live audits, and debug outputs—all natively tied to your diagram.
                    </p>
                </div>

                {/* VS Code Style Editor Container */}
                <div className="max-w-5xl mx-auto border border-[#333333] bg-[#1e1e1e] rounded-xl overflow-hidden shadow-[0_30px_70px_rgba(0,0,0,0.7)] flex flex-col font-sans">

                    {/* 1. Editor Title Bar (MacOS / VS Code style) */}
                    <div className="h-10 bg-[#2d2d2d] flex items-center px-4 border-b border-[#1e1e1e] select-none text-[11px] text-gray-400 font-medium">
                        <div className="flex gap-2 w-1/3">
                            <div className="w-3 h-3 rounded-full bg-red-500/90 border border-red-600"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500/90 border border-yellow-600"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500/90 border border-green-600"></div>
                        </div>
                        <div className="w-1/3 flex justify-center text-center opacity-80 bg-[#1e1e1e] rounded-md px-10 py-1 font-mono tracking-tight border border-[#3c3c3c]">
                            flowstate-workspace
                        </div>
                        <div className="w-1/3"></div>
                    </div>

                    {/* 2. Main Editor Layout: Activity Bar + Sidebar + Editor Pane */}
                    <div className="flex flex-1 min-h-[500px]">

                        {/* 2.1 Left Activity Bar */}
                        <div className="w-12 bg-[#333333] flex flex-col items-center py-4 gap-6 shrink-0 border-r border-[#2d2d2d] text-gray-400">
                            <div className="flex flex-col gap-5 items-center w-full relative">
                                <div className="absolute -left-[1px] w-0.5 h-6 bg-indigo-500"></div>
                                <div className="w-full flex justify-center cursor-pointer text-white">
                                    <Layers className="w-5 h-5 text-white" />
                                </div>
                                <div className="w-full flex justify-center cursor-pointer opacity-40 hover:opacity-100 transition-opacity">
                                    <Search className="w-5 h-5" />
                                </div>
                                <div className="w-full flex justify-center cursor-pointer opacity-40 hover:opacity-100 transition-opacity">
                                    <GitBranch className="w-5 h-5" />
                                </div>
                                <div className="w-full flex justify-center cursor-pointer opacity-40 hover:opacity-100 transition-opacity">
                                    <Play className="w-5 h-5" />
                                </div>
                                <div className="w-full flex justify-center cursor-pointer opacity-40 hover:opacity-100 transition-opacity">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                            </div>

                            <div className="flex lg:flex-col gap-5 items-center">
                                <div className="cursor-pointer opacity-40 hover:opacity-100 transition-opacity">
                                    <Users className="w-5 h-5" />
                                </div>
                                <div className="cursor-pointer opacity-40 hover:opacity-100 transition-opacity">
                                    <Settings className="w-5 h-5" />
                                </div>
                            </div>
                        </div>

                        {/* 2.2 Left Workspace Explorer Sidebar */}
                        <div className="w-full lg:w-56 bg-[#252526] border-r border-[#2d2d2d] flex flex-col shrink-0 text-left">
                            <div className="p-3 border-b border-[#2d2d2d] flex justify-between items-center select-none">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Explorer</span>
                                <span className="text-[9px] font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">workspace</span>
                            </div>

                            <div className="p-2">
                                <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 px-1 select-none">
                                    <span>▼ flowstate-app</span>
                                </div>

                                <div className="flex flex-col gap-0.5">
                                    {codeFiles.map((file, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                setActiveFileIndex(idx);
                                                if (!file.name.endsWith('.md')) {
                                                    setIsPreviewMode(false);
                                                }
                                            }}
                                            className={`flex items-center gap-2 px-2.5 py-1.5 rounded text-xs transition-colors w-full text-left ${activeFileIndex === idx
                                                    ? 'bg-[#37373d] text-white'
                                                    : 'text-gray-450 hover:bg-[#2a2a2b] hover:text-gray-200'
                                                }`}
                                        >
                                            <div className={`${file.name.endsWith('.tf') ? 'text-orange-400' :
                                                    file.name.endsWith('.prisma') ? 'text-purple-400' :
                                                        file.name.endsWith('.yml') ? 'text-emerald-400' :
                                                            'text-indigo-400'
                                                }`}>
                                                {file.name.endsWith('.tf') ? <Code className="w-3.5 h-3.5" /> :
                                                    file.name.endsWith('.prisma') ? <Database className="w-3.5 h-3.5" /> :
                                                        file.name.endsWith('.yml') ? <Terminal className="w-3.5 h-3.5" /> :
                                                            <Layers className="w-3.5 h-3.5" />}
                                            </div>
                                            <span className="truncate flex-1 font-mono text-[11px]">{file.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* 2.3 Main Editor Area & Terminal Pane */}
                        <div className="flex-grow flex flex-col bg-[#1e1e1e] min-w-0">

                            {/* 2.3.1 Editor Tabs Bar */}
                            <div className="h-9 bg-[#2d2d2d] flex items-center justify-between border-b border-[#252526] select-none text-xs">
                                <div className="flex overflow-x-auto h-full scrollbar-none items-end">
                                    {codeFiles.map((file, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => {
                                                setActiveFileIndex(idx);
                                                if (!file.name.endsWith('.md')) {
                                                    setIsPreviewMode(false);
                                                }
                                            }}
                                            className={`h-full flex items-center gap-2 px-4 cursor-pointer border-r border-[#252526] text-[11px] font-mono transition-colors ${activeFileIndex === idx
                                                    ? 'bg-[#1e1e1e] text-white border-t border-t-indigo-500'
                                                    : 'bg-[#2d2d2d] text-gray-500 hover:bg-[#333333]'
                                                }`}
                                        >
                                            <span className="truncate">{file.name}</span>
                                        </div>
                                    ))}
                                </div>

                                {codeFiles[activeFileIndex].name.endsWith('.md') && (
                                    <div className="flex items-center gap-1.5 px-3">
                                        <button
                                            onClick={() => setIsPreviewMode(false)}
                                            className={`px-2 py-0.5 rounded text-[9px] font-mono ${!isPreviewMode ? 'bg-[#37373d] text-white' : 'text-gray-500 hover:text-white'}`}
                                        >
                                            Code
                                        </button>
                                        <button
                                            onClick={() => setIsPreviewMode(true)}
                                            className={`px-2 py-0.5 rounded text-[9px] font-mono ${isPreviewMode ? 'bg-[#37373d] text-white' : 'text-gray-500 hover:text-white'}`}
                                        >
                                            Preview
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* 2.3.2 Breadcrumb Bar */}
                            <div className="h-6 bg-[#1e1e1e] border-b border-[#252526] px-4 flex items-center text-[10px] text-gray-500 font-mono select-none">
                                <span>flowstate-app</span>
                                <span className="mx-1.5">›</span>
                                <span>src</span>
                                <span className="mx-1.5">›</span>
                                <span>generated</span>
                                <span className="mx-1.5">›</span>
                                <span className="text-gray-400">{codeFiles[activeFileIndex].name}</span>
                            </div>

                            {/* 2.3.3 Code Viewport */}
                            <div className="flex-1 p-4 overflow-y-auto max-h-[280px] font-mono text-[11px] md:text-xs text-gray-300 text-left bg-[#1e1e1e]">
                                {isPreviewMode ? (
                                    <div className="prose prose-invert max-w-none text-slate-350 text-[11px] font-sans">
                                        {codeFiles[activeFileIndex].name === "architecture.md" && (
                                            <div>
                                                <h1 className="text-xs font-bold text-white border-b border-white/[0.08] pb-1 mb-3"># Architecture Design: FlowState Stack</h1>
                                                <p className="mb-3">This document describes the high-availability configuration compiled from the visual workspace canvas.</p>
                                                <h2 className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider mb-2">## Network Topology</h2>
                                                <ul className="list-disc list-inside space-y-1 text-slate-400">
                                                    <li><strong>Internet Ingress</strong>: Public Application Load Balancer</li>
                                                    <li><strong>Service Mesh</strong>: ECS / FastAPI WebSocket Gateway</li>
                                                    <li><strong>Data Persistence</strong>: DynamoDB Cluster (Global Tables enabled)</li>
                                                </ul>
                                            </div>
                                        )}
                                        {codeFiles[activeFileIndex].name === "threat_model.md" && (
                                            <div>
                                                <h1 className="text-xs font-bold text-white border-b border-white/[0.08] pb-1 mb-3"># Threat Modeling Analysis</h1>
                                                <p className="mb-3 text-emerald-400/90 font-mono text-[10px]">✓ Compiled by security analyzer module</p>
                                                <h2 className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider mb-2">## Risks &amp; Mitigations</h2>
                                                <div className="space-y-2.5">
                                                    <div className="border border-white/[0.05] rounded-lg p-2 bg-white/[0.01]">
                                                        <div className="font-semibold text-rose-400 text-[10px]">1. Unencrypted DB Writes</div>
                                                        <div className="text-[9px] text-slate-400 mt-1">Mitigation: DynamoDB table configured with SSE-KMS customer key.</div>
                                                    </div>
                                                    <div className="border border-white/[0.05] rounded-lg p-2 bg-white/[0.01]">
                                                        <div className="font-semibold text-orange-400 text-[10px]">2. Permissive ALB SGs</div>
                                                        <div className="text-[9px] text-slate-400 mt-1">Mitigation: Ingress limited strictly to active service port mapping.</div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <pre className="whitespace-pre-wrap">
                                        {codeFiles[activeFileIndex].content.split('\n').map((line, lIdx) => (
                                            <div key={lIdx} className="flex gap-4">
                                                <span className="text-[#858585] select-none w-5 text-right font-mono text-[10px]">{lIdx + 1}</span>
                                                <span className="text-[#d4d4d4] font-mono">{line}</span>
                                            </div>
                                        ))}
                                    </pre>
                                )}
                            </div>

                            {/* 2.3.4 Integrated VS Code Terminal Panel */}
                            <div className="h-44 bg-[#18181c] border-t border-[#2d2d2d] flex flex-col text-left font-mono">
                                <div className="flex bg-[#1f1f24] px-4 py-1.5 border-b border-[#2d2d2d] text-[10px] text-gray-500 gap-5 select-none font-sans shrink-0">
                                    <span className="text-gray-300 font-semibold border-b border-b-indigo-500 pb-0.5 cursor-pointer">TERMINAL</span>
                                    <span className="hover:text-gray-300 cursor-pointer">OUTPUT</span>
                                    <span className="hover:text-gray-300 cursor-pointer">DEBUG CONSOLE</span>
                                    <span className="hover:text-gray-300 cursor-pointer">PROBLEMS (0)</span>

                                    <div className="ml-auto flex items-center gap-3">
                                        <button
                                            onClick={triggerValidation}
                                            disabled={isAnalyzing}
                                            className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[9px] font-mono flex items-center gap-1 transition-all"
                                        >
                                            <Play className="w-2.5 h-2.5 fill-white" />
                                            RUN TASK
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 p-3 overflow-y-auto text-[9px] leading-relaxed text-gray-300 bg-[#151518]">
                                    {analysisLogs.map((log, lIdx) => (
                                        <div key={lIdx} className="flex gap-2 items-start">
                                            <span className="text-indigo-400 shrink-0 select-none">&gt;</span>
                                            <span className={lIdx === analysisLogs.length - 1 ? "text-white font-bold" : "text-gray-400"}>
                                                {log}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>

                    </div>

                    {/* 3. VS Code Status Bar */}
                    <div className="h-6 bg-[#4f46e5] text-white flex items-center justify-between px-3 text-[10px] font-sans shrink-0 select-none">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer">
                                <GitBranch className="w-3 h-3" />
                                <span>main*</span>
                            </div>
                            <div className="flex items-center gap-1 hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer">
                                <Activity className="w-3 h-3" />
                                <span>Compiler: Active</span>
                            </div>
                            <span className="text-white/60">0 ⓧ 0 ⚠</span>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="hidden sm:inline">Ln {codeFiles[activeFileIndex].content.split('\n').length}, Col 1</span>
                            <span>Spaces: 2</span>
                            <span>UTF-8</span>
                            <span className="hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer">Prettier ✓</span>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
