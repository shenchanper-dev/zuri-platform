#!/bin/bash
set -e
ROOT=~/zuri-platform
UI_DIR=$ROOT/src/components/ui

echo "== Regenerando UI components en $UI_DIR =="
mkdir -p "$UI_DIR"

# Card
cat > "$UI_DIR/card.tsx" <<'TSX'
import React from "react";

type DivProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ children, className = "", ...props }: DivProps & { children: React.ReactNode }) {
  return <div className={`rounded-2xl shadow p-4 bg-white ${className}`} {...props}>{children}</div>;
}

export function CardHeader({ children, className = "", ...props }: DivProps & { children: React.ReactNode }) {
  return <div className={`mb-2 font-semibold text-lg ${className}`} {...props}>{children}</div>;
}

export function CardTitle({ children, className = "", ...props }: DivProps & { children: React.ReactNode }) {
  return <h3 className={`text-xl font-bold ${className}`} {...props}>{children}</h3>;
}

export function CardContent({ children, className = "", ...props }: DivProps & { children: React.ReactNode }) {
  return <div className={className} {...props}>{children}</div>;
}
TSX

# Button (definitiva: acepta ghost, destructive, outline, default)
cat > "$UI_DIR/button.tsx" <<'TSX'
import React from "react";

type ButtonVariant = "default" | "outline" | "ghost" | "destructive";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  className?: string;
}

export function Button({ variant = "default", className = "", children, ...props }: ButtonProps) {
  const base = "px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  const variants: Record<ButtonVariant, string> = {
    default: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-300",
    ghost: "bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-200",
    destructive: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
TSX

# Badge
cat > "$UI_DIR/badge.tsx" <<'TSX'
import React from "react";

export function Badge({ children, className = "", color = "gray" }: { children: React.ReactNode; className?: string; color?: string }) {
  const colors: Record<string, string> = {
    gray: "bg-gray-200 text-gray-800",
    green: "bg-green-200 text-green-800",
    red: "bg-red-200 text-red-800",
    blue: "bg-blue-200 text-blue-800",
    yellow: "bg-yellow-200 text-yellow-800",
  };
  return <span className={`px-2 py-1 text-sm rounded-full font-medium ${colors[color] || colors.gray} ${className}`}>{children}</span>;
}
TSX

# Input
cat > "$UI_DIR/input.tsx" <<'TSX'
import React from "react";

export function Input({ value, onChange, placeholder, type = "text", className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input type={type} value={value} onChange={onChange} placeholder={placeholder} className={`border rounded-lg px-3 py-2 w-full ${className}`} {...props} />;
}
TSX

# Label
cat > "$UI_DIR/label.tsx" <<'TSX'
import React from "react";

export function Label({ htmlFor, children, className = "", ...props }: { htmlFor?: string; children: React.ReactNode; className?: string } & React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label htmlFor={htmlFor} className={`block text-sm font-medium text-gray-700 mb-1 ${className}`} {...props}>
      {children}
    </label>
  );
}
TSX

# Textarea
cat > "$UI_DIR/textarea.tsx" <<'TSX'
import React from "react";

export function Textarea({ value, onChange, placeholder, className = "", rows = 3, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea value={value as any} onChange={onChange} placeholder={placeholder} rows={rows} className={`border rounded-lg px-3 py-2 w-full resize-none ${className}`} {...props as any} />;
}
TSX

# Toaster (export named Toaster)
cat > "$UI_DIR/toaster.tsx" <<'TSX'
"use client";
import React, { useEffect } from "react";

export function Toaster() {
  useEffect(() => {
    console.log("Toaster initialized");
  }, []);
  return null;
}
TSX

# index barrel for easier imports
cat > "$UI_DIR/index.ts" <<'TS'
export * from "./card";
export * from "./button";
export * from "./badge";
export * from "./input";
export * from "./label";
export * from "./textarea";
export * from "./toaster";
export { default as ToasterDefault } from "./toaster";
