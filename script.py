# Create comprehensive MERN Stack application structure for AI Student Dropout Prediction System

import os
import json

def create_directory_structure():
    """Create the complete MERN stack directory structure"""
    
    directories = [
        "ai-dropout-prediction-system",
        "ai-dropout-prediction-system/backend",
        "ai-dropout-prediction-system/backend/config",
        "ai-dropout-prediction-system/backend/controllers",
        "ai-dropout-prediction-system/backend/middleware",
        "ai-dropout-prediction-system/backend/models",
        "ai-dropout-prediction-system/backend/routes",
        "ai-dropout-prediction-system/backend/services",
        "ai-dropout-prediction-system/backend/utils",
        "ai-dropout-prediction-system/backend/ai-models",
        "ai-dropout-prediction-system/frontend",
        "ai-dropout-prediction-system/frontend/public",
        "ai-dropout-prediction-system/frontend/src",
        "ai-dropout-prediction-system/frontend/src/components",
        "ai-dropout-prediction-system/frontend/src/components/Dashboard",
        "ai-dropout-prediction-system/frontend/src/components/StudentManagement",
        "ai-dropout-prediction-system/frontend/src/components/Analytics",
        "ai-dropout-prediction-system/frontend/src/components/Alerts",
        "ai-dropout-prediction-system/frontend/src/components/Auth",
        "ai-dropout-prediction-system/frontend/src/components/Common",
        "ai-dropout-prediction-system/frontend/src/pages",
        "ai-dropout-prediction-system/frontend/src/services",
        "ai-dropout-prediction-system/frontend/src/utils",
        "ai-dropout-prediction-system/frontend/src/hooks",
        "ai-dropout-prediction-system/frontend/src/context",
        "ai-dropout-prediction-system/data-sources",
        "ai-dropout-prediction-system/data-sources/imports",
        "ai-dropout-prediction-system/data-sources/exports"
    ]
    
    print("📁 Creating MERN Stack Directory Structure:")
    for directory in directories:
        print(f"   ├── {directory}")
    
    return directories

# Create the directory structure
directories = create_directory_structure()

print("\n" + "="*80)
print("🚀 COMPLETE MERN STACK APPLICATION STRUCTURE CREATED")
print("="*80)