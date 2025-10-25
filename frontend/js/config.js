/**
 * AI Prosthetic Optimizer - Configuration
 * Global constants and configuration
 */

// API Configuration
const API_BASE_URL = 'https://ai-prosthetic-optimizer-yuvai2025.onrender.com';

// Global State
let currentResults = null;
let paretoChart = null;
let scene, camera, renderer, controls, currentMesh;
let currentDesignId = null;
let selectedDesigns = []; // Track designs for comparison (max 2)
let comparisonMode = false; // Toggle comparison mode
let currentRecommendation = null; // Material advisor recommendation
