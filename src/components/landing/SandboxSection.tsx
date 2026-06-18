"use client";

import React, { useState } from 'react';
import { Globe, Cpu, Layers, Database, Settings } from 'lucide-react';

const specs = {
    'three-tier': {
        title: 'Standard Three-Tier Web App',
        desc: 'Autoscaling Web servers with a Multi-AZ Database and public/private subnets.',
        iac: `resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
}

resource "aws_elb" "web_alb" {
  name            = "web-application-load-balancer"
  subnets         = [aws_subnet.public_a.id, aws_subnet.public_b.id]
  security_groups = [aws_security_group.alb_sg.id]
}

resource "aws_autoscaling_group" "web_asg" {
  desired_capacity    = 2
  max_size            = 5
  min_size            = 1
  target_group_arns   = [aws_lb_target_group.web_tg.arn]
}

resource "aws_db_instance" "postgres" {
  allocated_storage   = 20
  engine              = "postgres"
  engine_version      = "15.4"
  instance_class      = "db.t4g.micro"
  multi_az            = true
}`
    },
    'serverless': {
        title: 'Serverless REST API',
        desc: 'AWS API Gateway routing requests to Lambda functions backend with a DynamoDB storage layer.',
        iac: `resource "aws_apigatewayv2_api" "http_api" {
  name          = "serverless-rest-api"
  protocol_type = "HTTP"
}

resource "aws_lambda_function" "api_handler" {
  function_name = "api-request-handler"
  runtime       = "nodejs18.x"
  handler       = "index.handler"
  role          = aws_iam_role.lambda_exec.arn
}

resource "aws_dynamodb_table" "database" {
  name           = "app-users-data"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "userId"

  attribute {
    name = "userId"
    type = "S"
  }
}`
    },
    'event-driven': {
        title: 'Event-Driven Microservices',
        desc: 'Decoupled publisher-subscriber network using AWS SNS, SQS, and asynchronous processors.',
        iac: `resource "aws_sns_topic" "user_events" {
  name = "user-activity-topic"
}

resource "aws_sqs_queue" "process_queue" {
  name                      = "user-event-processor-queue"
  message_retention_seconds = 86400
}

resource "aws_sns_topic_subscription" "sns_to_sqs" {
  topic_arn = aws_sns_topic.user_events.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.process_queue.arn
}

resource "aws_lambda_function" "worker" {
  function_name = "queue-message-processor"
  runtime       = "python3.11"
}`
    }
};

export default function SandboxSection() {
    const [selectedSpec, setSelectedSpec] = useState<'three-tier' | 'serverless' | 'event-driven'>('three-tier');

    return (
        <section id="sandbox" className="py-24 px-6 relative z-10 border-b border-white/[0.05]">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-indigo-500/[0.02] rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-6xl mx-auto relative z-10">
                <div className="text-center mb-12">
                    <div className="flex justify-center mb-4"><span className="px-3 py-1 text-[10px] sm:text-xs font-mono font-bold tracking-widest uppercase rounded-full bg-white/10 text-white border border-white/20 backdrop-blur-md shadow-lg">IaC Automation</span></div>
                    <h3 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
                        From Visual Architecture to Clean Terraform
                    </h3>
                    <p className="text-sm text-gray-400 max-w-2xl mx-auto leading-relaxed mb-6">
                        Design system topology. FlowState automatically compiles production-ready HashiCorp HCL with zero legacy dependencies, ready to run in any CLI.
                    </p>
                </div>

                {/* Architecture Selector Tabs */}
                <div className="flex flex-wrap justify-center gap-3 mb-8">
                    {(Object.keys(specs) as Array<keyof typeof specs>).map((key) => (
                        <button
                            key={key}
                            onClick={() => setSelectedSpec(key)}
                            className={`px-4 py-2 rounded-full border text-xs font-semibold transition-all duration-200 ${selectedSpec === key ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20' : 'bg-[#0f0f13]/60 border-white/[0.05] text-gray-400 hover:bg-[#15151c]/60 hover:text-gray-200'}`}
                        >
                            {specs[key].title}
                        </button>
                    ))}
                </div>

                {/* Unified IDE Workspace View */}
                <div className="max-w-5xl mx-auto border border-white/[0.08] bg-[#0b0b0e] rounded-2xl overflow-hidden shadow-[0_30px_70px_rgba(0,0,0,0.6)] flex flex-col">
                    {/* IDE Tab Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-[#0d0d12] border-b border-white/[0.05]">
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                            <span className="text-[10px] font-mono text-gray-500 ml-4">spec_compiler.tf</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Live Compiler Active
                        </div>
                    </div>

                    {/* IDE Body Workspace */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[420px]">
                        {/* Left Panel: Visual Whiteboard Node Simulation */}
                        <div className="lg:col-span-5 bg-[#070709] bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:16px_16px] relative flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-white/[0.05]">
                            <div className="absolute top-3 left-4 text-[9px] font-mono text-gray-600">VISUAL CANVAS VIEW</div>
                            <div className="flex flex-col items-center gap-3 py-10 px-6 justify-center h-full">
                                {(selectedSpec === 'three-tier' ? [
                                    { label: 'Internet Client', sub: 'Public HTTP/S traffic', icon: 'globe' },
                                    { label: 'aws_elb.web_alb', sub: 'Application Load Balancer', icon: 'cpu' },
                                    { label: 'aws_autoscaling_group.web_asg', sub: 'Web Servers (Multi-AZ)', icon: 'layers' },
                                    { label: 'aws_db_instance.postgres', sub: 'Postgres (Primary/Standby)', icon: 'database' }
                                ] : selectedSpec === 'serverless' ? [
                                    { label: 'Client Requests', sub: 'REST HTTP API calls', icon: 'globe' },
                                    { label: 'aws_apigatewayv2_api.http_api', sub: 'HTTP API Gateway v2', icon: 'cpu' },
                                    { label: 'aws_lambda_function.api_handler', sub: 'NodeJS Lambda Execution', icon: 'settings' },
                                    { label: 'aws_dynamodb_table.database', sub: 'DynamoDB Pay-Per-Request', icon: 'database' }
                                ] : [
                                    { label: 'Activity Publisher', sub: 'User Events Stream', icon: 'globe' },
                                    { label: 'aws_sns_topic.user_events', sub: 'SNS Fan-out Topic', icon: 'cpu' },
                                    { label: 'aws_sqs_queue.process_queue', sub: 'SQS Worker Queue', icon: 'layers' },
                                    { label: 'aws_lambda_function.worker', sub: 'Python Event Handler', icon: 'settings' }
                                ]).map((node, index) => (
                                    <React.Fragment key={index}>
                                        {index > 0 && (
                                            <div className="w-[1px] h-4 bg-gradient-to-b from-indigo-500/40 to-purple-500/10 relative">
                                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1]" />
                                            </div>
                                        )}
                                        <div className="w-full max-w-[280px] p-2.5 rounded-xl border border-white/[0.04] bg-black/60 backdrop-blur-sm flex items-center gap-3 hover:border-indigo-500/20 hover:bg-black/80 transition-all duration-300">
                                            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                                                {node.icon === 'globe' && <Globe className="w-3.5 h-3.5" />}
                                                {node.icon === 'cpu' && <Cpu className="w-3.5 h-3.5" />}
                                                {node.icon === 'layers' && <Layers className="w-3.5 h-3.5" />}
                                                {node.icon === 'database' && <Database className="w-3.5 h-3.5" />}
                                                {node.icon === 'settings' && <Settings className="w-3.5 h-3.5" />}
                                            </div>
                                            <div className="text-left flex-1 min-w-0">
                                                <div className="text-[10px] font-mono text-gray-300 font-bold truncate leading-tight">{node.label}</div>
                                                <div className="text-[9px] text-gray-500 truncate mt-0.5 leading-tight">{node.sub}</div>
                                            </div>
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981] shrink-0" />
                                        </div>
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>

                        {/* Right Panel: Terraform HCL Code Editor */}
                        <div className="lg:col-span-7 flex flex-col bg-[#08080b]">
                            <div className="flex-1 flex overflow-hidden font-mono text-xs text-left min-h-[380px]">
                                {/* Line numbers column */}
                                <div className="p-4 pr-2 text-gray-600 select-none text-right border-r border-white/[0.03] bg-black/10 leading-5 text-[10px]">
                                    {specs[selectedSpec].iac.split('\n').map((_, i) => (
                                        <div key={i} className="h-5">{i + 1}</div>
                                    ))}
                                </div>
                                {/* Code column */}
                                <pre className="flex-1 p-4 pl-4 bg-[#08080b]/30 overflow-y-auto leading-5 text-gray-300 select-all selection:bg-indigo-500/30 text-[11px]">
                                    <code>{specs[selectedSpec].iac}</code>
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
