
IBBE Orbital Design System
A guide to creating clarity through chaos. We use strict geometry (circles) and physical presence (tactility) to organize information.

01_PRINCIPLES
Core Philosophy
Deference to Content
The interface (circles, borders) should recede. Content is the gravitational center. Use negative space to let the most important element breathe. Never clutter.

Clarity Over Style
Legibility is paramount. Use high-contrast colors (#1D1D1F on #FFF9F0) and large, legible type sizes (Inter). Avoid decorative elements that do not serve a navigational or hierarchical purpose.

Depth & Feedback
Objects must feel real. Use consistent 8px shadows (`box-shadow`) to establish a light source and hierarchy. Interactive elements must look touchable.

02_COLOR_PHYSICS
#F7F2E9
Canvas Cream
#FFF9F0
Bone White
#1D1D1F
Charcoal
#FFD60A
Orbital Yellow
#2962FF
Signal Blue
#28C76F
System Green

/* CSS VARIABLES */
:root {
  --bg: #F7F2E9;      /* Backgrounds */
  --surface: #FFF9F0; /* Cards/Circles */
  --ink: #1D1D1F;     /* Text/Borders */
  --accent: #FFD60A;  /* Primary Focus */
}
      
03_GEOMETRY_SYSTEM
The 70/30 Rule: 70% of the layout should be circular (organic, flowing), anchored by 30% rectilinear elements (cards, text blocks) for stability.

CORE
SYSTEM

/* THE PERFECT CIRCLE CLASS */
.orbital-element {
  border-radius: 50%;
  border: 3px solid #1D1D1F;
  box-shadow: 8px 8px 0px #1D1D1F; /* Tactile Depth */
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1 / 1; /* Maintains Circle Ratio */
}
        
04_TYPOGRAPHY
Display 48px
Headline 32px
Body 18px — The quick brown fox jumps over the lazy dog. Used for all narrative content.

MONO 14PX — METADATA / TAGS
FONT STACK: 'INTER', SYSTEM-UI, SANS-SERIF
05_SOCIAL_TEMPLATE_1080
Instagram Layout Structure:

1. Canvas: 1080x1080px (#F7F2E9)
2. Center: Concentric Circle Group (60% width)
3. Corners: Satellite Elements (Logos, badges)
4. Shadows: Deep (16px) for visibility on mobile.



  
  

  
  
  

     

        

           
HEADLINE

        

     

  


  
  
LOGO

  
01


        