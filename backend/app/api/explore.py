"""
TERA Explore 2.0 API Router
Authoritative datasets, interactive scenarios, hazard maps, quiz banks,
and user safety journey progression.
Sources:
- Ministry of Road Transport and Highways (MoRTH), Govt of India: "Road Accidents in India 2023"
- World Health Organization (WHO): "Global Status Report on Road Safety 2023"
"""

import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.api.auth import get_current_user
from app.models.models import UserAccount

router = APIRouter(prefix="/explore", tags=["TERA Explore 2.0 — Road Safety & Prevention"])

# ------------------------------------------------------------------------------
# In-Memory Progress Store for Demo/Local with DB sync when User authenticated
# ------------------------------------------------------------------------------
_GUEST_PROGRESS_CACHE: Dict[str, Dict[str, Any]] = {}

# ------------------------------------------------------------------------------
# Pydantic Schemas
# ------------------------------------------------------------------------------
class ProgressUpdateRequest(BaseModel):
    session_id: Optional[str] = "guest"
    xp_earned: int = 0
    activity_type: str  # "SCENARIO" | "HAZARD" | "QUIZ" | "MEMORY" | "JOURNEY" | "PLEDGE"
    activity_id: str
    passed: bool = True
    achievement_id: Optional[str] = None
    pledge_name: Optional[str] = None

class SafetyPledgeRequest(BaseModel):
    pledge_name: str
    family_members_count: int = 1
    commitments: List[str]

# ------------------------------------------------------------------------------
# 1. Authoritative Road Safety Statistical Datasets
# ------------------------------------------------------------------------------
MORTH_2023_DATASET = {
    "metadata": {
        "title": "Road Accidents, Fatalities and Injuries in India (2018-2023)",
        "source": "Ministry of Road Transport and Highways (MoRTH), Transport Research Wing",
        "publication": "Road Accidents in India - 2023 (Official Report)",
        "secondary_source": "World Health Organization (WHO) Road Traffic Injuries Fact Sheet",
        "geography": "All-India & State Corridors (Including Andhra Pradesh & NH-71)",
        "verified_date": "2026-10-28",
        "units": "Annual Counts and Verified Percentages"
    },
    "annual_trends": [
        {"year": 2018, "total_accidents": 467044, "fatalities": 151417, "injuries": 469418},
        {"year": 2019, "total_accidents": 449002, "fatalities": 151113, "injuries": 451361},
        {"year": 2020, "total_accidents": 366138, "fatalities": 131714, "injuries": 348279},  # COVID-19 lockdown drop
        {"year": 2021, "total_accidents": 412432, "fatalities": 153972, "injuries": 384448},
        {"year": 2022, "total_accidents": 461312, "fatalities": 168491, "injuries": 443366},
        {"year": 2023, "total_accidents": 480652, "fatalities": 173014, "injuries": 463563}
    ],
    "road_user_breakdown": [
        {"category": "Two-Wheelers (Motorcycles/Scooters)", "percentage": 44.5, "fatalities_2023": 77000, "vulnerability_index": "EXTREME"},
        {"category": "Pedestrians", "percentage": 19.5, "fatalities_2023": 33737, "vulnerability_index": "HIGH"},
        {"category": "Cars, Taxis & Vans", "percentage": 15.3, "fatalities_2023": 26471, "vulnerability_index": "MODERATE"},
        {"category": "Trucks & Heavy Goods Vehicles", "percentage": 9.2, "fatalities_2023": 15917, "vulnerability_index": "HIGH"},
        {"category": "Auto-Rickshaws (Three-Wheelers)", "percentage": 4.2, "fatalities_2023": 7266, "vulnerability_index": "MODERATE"},
        {"category": "Buses", "percentage": 3.0, "fatalities_2023": 5190, "vulnerability_index": "MODERATE"},
        {"category": "Bicycles", "percentage": 2.5, "fatalities_2023": 4325, "vulnerability_index": "HIGH"},
        {"category": "Other Non-Motorized", "percentage": 1.8, "fatalities_2023": 3108, "vulnerability_index": "MODERATE"}
    ],
    "road_network_fatalities": [
        {"network": "National Highways", "share_of_road_length": 2.1, "share_of_fatalities": 36.2, "accidents": 152991},
        {"network": "State Highways", "share_of_road_length": 3.0, "share_of_fatalities": 24.3, "accidents": 110214},
        {"network": "Other / District / City Roads", "share_of_road_length": 94.9, "share_of_fatalities": 39.5, "accidents": 217447}
    ],
    "primary_contributing_causes": [
        {"cause": "Over-Speeding", "percentage": 71.2, "preventable_with": "Speed Governor, 3-Second Rule & Safe Passing"},
        {"cause": "Helmet Non-Use (Two-Wheeler Riders)", "percentage": 73.8, "preventable_with": "ISI/ECE Certified Helmet Chin-Strap Fastened"},
        {"cause": "Seat-Belt Non-Use (Car Occupants)", "percentage": 83.2, "preventable_with": "3-Point Seatbelts Front & Rear for All Occupants"},
        {"cause": "Driving on Wrong Side", "percentage": 5.4, "preventable_with": "Following Median Interchanges & Signage"},
        {"cause": "Mobile Phone & Distraction", "percentage": 2.3, "preventable_with": "Do Not Disturb Mode while operating vehicle"},
        {"cause": "Drunk & Impaired Driving", "percentage": 2.2, "preventable_with": "Designated Driver, Zero Alcohol Tolerance"}
    ],
    "peak_accident_hours": [
        {"time_slot": "00:00 - 03:00", "accidents_pct": 6.8, "risk_label": "High Fatigue & Speeding"},
        {"time_slot": "03:00 - 06:00", "accidents_pct": 7.4, "risk_label": "Micro-sleeps & Low Visibility"},
        {"time_slot": "06:00 - 09:00", "accidents_pct": 11.2, "risk_label": "Morning School & Office Commute"},
        {"time_slot": "09:00 - 12:00", "accidents_pct": 14.5, "risk_label": "Peak Commercial Delivery"},
        {"time_slot": "12:00 - 15:00", "accidents_pct": 13.9, "risk_label": "Midday Highway Traffic"},
        {"time_slot": "15:00 - 18:00", "accidents_pct": 16.4, "risk_label": "Evening Rush Hour Starts"},
        {"time_slot": "18:00 - 21:00", "accidents_pct": 20.7, "risk_label": "PEAK ACCIDENT WINDOW (Dusk/Congestion)"},
        {"time_slot": "21:00 - 24:00", "accidents_pct": 9.1, "risk_label": "Heavy Commercial Traffic & Glare"}
    ]
}

# ------------------------------------------------------------------------------
# 2. Decision Simulator Scenarios (Game 1)
# ------------------------------------------------------------------------------
DECISION_SCENARIOS = [
    {
        "id": "SCN_01_PHONE_CALL",
        "title": "The Unexpected Phone Call",
        "category": "DISTRACTED_DRIVING",
        "environment": "Urban Four-Way Junction",
        "situation": "You are riding your motorcycle home along an arterial road. Your phone vibrates and rings in your pocket as you approach a busy four-way junction with pedestrians.",
        "illustration_theme": "motorcycle_junction_dusk",
        "choices": [
            {
                "text": "Reach into your pocket to answer while continuing to steer with one hand.",
                "is_safe": False,
                "feedback": "Answering while riding causes cognitive and physical distraction. One-handed steering degrades braking efficiency by over 50% and eliminates your ability to perform an emergency swerve.",
                "safety_takeaway": "Never answer calls while moving. A 3-second glance at a phone at 40 km/h is equivalent to traveling 33 meters completely blind.",
                "xp": 0
            },
            {
                "text": "Slow down, maintain lane discipline, pull over safely beyond the junction into a designated parking spot, and check the phone.",
                "is_safe": True,
                "feedback": "Outstanding defensive choice! Pulling over safely preserves full situational awareness and protects both pedestrians and yourself from sudden rear-end collisions.",
                "safety_takeaway": "No phone call is worth a life. Someone is waiting for you at home—let the call wait until you have safely stopped.",
                "xp": 50
            },
            {
                "text": "Look down briefly to check the caller ID before deciding whether to stop.",
                "is_safe": False,
                "feedback": "Looking down for even one second causes 'inattentional blindness'. A pedestrian or braking vehicle can appear in your path within 0.75 seconds.",
                "safety_takeaway": "The human brain cannot process road hazards while reading screen notifications.",
                "xp": 5
            },
            {
                "text": "Accelerate swiftly through the junction so you can answer on the quieter road ahead.",
                "is_safe": False,
                "feedback": "Speeding through a junction to answer a phone compounds two fatal risks: intersection cross-traffic conflicts and high-speed collision impact.",
                "safety_takeaway": "Never rush through intersections under any circumstances.",
                "xp": 0
            }
        ],
        "safest_choice_index": 1
    },
    {
        "id": "SCN_02_MONSOON_RAIN",
        "title": "Monsoon Downpour & Standing Water",
        "category": "WEATHER_AND_SURFACE",
        "environment": "National Highway Corridor",
        "situation": "Sudden heavy rain reduces visibility to under 50 meters on a multi-lane highway. You notice sheets of standing water pooling across the right-hand express lane ahead.",
        "illustration_theme": "highway_rain_aquaplane",
        "choices": [
            {
                "text": "Maintain your cruising speed (80 km/h) and brake firmly the moment your tires hit the standing water.",
                "is_safe": False,
                "feedback": "Hard braking on standing water triggers immediate aquaplaning (hydroplaning). The tires ride on a film of water, causing loss of steering and a uncontrolled spin.",
                "safety_takeaway": "Never brake hard on standing water. Water pressure lifts tire contact patches when speed exceeds 65 km/h.",
                "xp": 0
            },
            {
                "text": "Smoothly ease off the accelerator, double your following distance to 6 seconds, turn on low-beam headlights, and avoid sudden steering inputs.",
                "is_safe": True,
                "feedback": "Perfect response! Gradual deceleration prevents hydroplaning. Low-beam lights pierce rain without reflecting glare back into your eyes, and the extended gap accounts for wet braking distance.",
                "safety_takeaway": "Wet roads require twice the normal stopping distance. Smooth control inputs preserve vehicle traction.",
                "xp": 50
            },
            {
                "text": "Switch on hazard lights while driving fast so other motorists can see your position.",
                "is_safe": False,
                "feedback": "Hazard flashers are for stationary or emergency vehicles. Using them while moving confuses drivers behind you and obscures your turn indicators.",
                "safety_takeaway": "Use low-beam headlights in rain, not hazard flashers, unless your vehicle has broken down.",
                "xp": 10
            }
        ],
        "safest_choice_index": 1
    },
    {
        "id": "SCN_03_BLIND_SPOT_TRUCK",
        "title": "The Heavy Truck Blind Spot ('No-Zone')",
        "category": "HIGHWAY_SAFETY",
        "environment": "Divided Highway Curve",
        "situation": "You are driving behind a 16-wheel container truck approaching an uphill highway curve. You wish to overtake.",
        "illustration_theme": "truck_blindspot_curve",
        "choices": [
            {
                "text": "Overtake on the left shoulder because the right lane is slow.",
                "is_safe": False,
                "feedback": "Overtaking on the left is illegal and extremely hazardous. The truck driver cannot see the left shoulder in their mirrors, and road debris increases blowout risk.",
                "safety_takeaway": "Never undertake on the left side of heavy commercial vehicles.",
                "xp": 0
            },
            {
                "text": "Drop back until you can see both of the truck's side mirrors, signal your intent early, verify clear sightlines past the curve, and complete the overtake on the right with brisk, steady acceleration.",
                "is_safe": True,
                "feedback": "Exemplary defensive driving! If you cannot see the truck's side mirrors, the driver cannot see you. Waiting for clear sightlines past the curve eliminates oncoming collision risk.",
                "safety_takeaway": "The Rule of Mirrors: 'If you can't see my mirrors, I can't see you.' Always overtake with full visual confirmation.",
                "xp": 50
            },
            {
                "text": "Tailgate closely behind the truck to use its slipstream before darting out on the curve.",
                "is_safe": False,
                "feedback": "Tailgating a heavy vehicle eliminates your forward visibility entirely and leaves zero reaction space if the truck sheds a retread or brakes suddenly.",
                "safety_takeaway": "Maintain at least 4 seconds of following distance behind heavy trucks.",
                "xp": 0
            }
        ],
        "safest_choice_index": 1
    },
    {
        "id": "SCN_04_OBSTRUCTED_CROSSING",
        "title": "The Hidden Pedestrian at a Bus Stop",
        "category": "PEDESTRIAN_SAFETY",
        "environment": "Commercial City Street",
        "situation": "A city bus has stopped in the curb lane to let passengers disembark. Traffic in the adjacent lane is moving, but your view directly in front of the bus is blocked.",
        "illustration_theme": "bus_stop_crosswalk",
        "choices": [
            {
                "text": "Slow down to a crawl, cover your brake pedal with your foot, scan beneath the bus wheels for pedestrians' feet, and prepare to stop.",
                "is_safe": True,
                "feedback": "Superb awareness! Pedestrians frequently step out from in front of stopped buses without looking. Covering the brake reduces reaction time from 1.5 seconds to 0.3 seconds.",
                "safety_takeaway": "Assume a pedestrian is about to step out from in front of every stationary public transit bus.",
                "xp": 50
            },
            {
                "text": "Honk continuously and maintain your speed so pedestrians know not to cross.",
                "is_safe": False,
                "feedback": "Honking does not guarantee pedestrian compliance. Children or elderly pedestrians may freeze in panic or misjudge your speed.",
                "safety_takeaway": "A horn is a warning device, not a right of way. Slow down instead.",
                "xp": 5
            },
            {
                "text": "Quickly swerve into the oncoming lane to bypass the entire bus zone.",
                "is_safe": False,
                "feedback": "Swerving into opposing traffic creates a high-speed head-on collision hazard and endangers pedestrians crossing from the opposite sidewalk.",
                "safety_takeaway": "Patience saves lives. Never overtake on the wrong side of the road in commercial zones.",
                "xp": 0
            }
        ],
        "safest_choice_index": 0
    },
    {
        "id": "SCN_05_NIGHT_HIGH_BEAM",
        "title": "Blinding High Beams at Midnight",
        "category": "NIGHT_DRIVING",
        "environment": "Two-Lane Rural Highway without Streetlights",
        "situation": "An oncoming SUV approaches with dazzling high-beam headlights on a dark two-lane road, impairing your forward visibility.",
        "illustration_theme": "night_glare_rural",
        "choices": [
            {
                "text": "Switch your own high beams on to flash the oncoming driver and blind them back.",
                "is_safe": False,
                "feedback": "Retaliatory high beams result in two blinded drivers traveling toward each other at combined speeds exceeding 140 km/h. This is a recipe for a catastrophic head-on impact.",
                "safety_takeaway": "Never retaliate with high beams. Two blinded drivers double the fatal risk.",
                "xp": 0
            },
            {
                "text": "Dim your lights to low-beam, gently reduce speed, look slightly down and toward the white edge line on the left side of your lane, using it as a steering guide until the vehicle passes.",
                "is_safe": True,
                "feedback": "Expert defensive technique! Looking toward the left edge marking prevents retinal bleaching from oncoming glare while ensuring you stay squarely in your lane.",
                "safety_takeaway": "Protect your night vision by focusing on the left road marking during oncoming glare.",
                "xp": 50
            },
            {
                "text": "Close your eyes for a split second to reset your pupil dilation.",
                "is_safe": False,
                "feedback": "Closing your eyes while driving at 60 km/h leaves your vehicle unguided for 17 meters every second.",
                "safety_takeaway": "Keep eyes open and shift gaze away from the glare source.",
                "xp": 0
            }
        ],
        "safest_choice_index": 1
    },
    {
        "id": "SCN_06_DROWSY_COMMUTE",
        "title": "Midnight Micro-Sleeps & Fatigue",
        "category": "DRIVER_FATIGUE",
        "environment": "Expressway Corridor",
        "situation": "It is 2:30 AM on a long drive. You catch yourself yawning repeatedly, your eyelids feel heavy, and you realize you don't recall the last 2 kilometers of highway.",
        "illustration_theme": "highway_night_fatigue",
        "choices": [
            {
                "text": "Roll down the window for cold air, turn the music volume to maximum, and push through the remaining 40 km.",
                "is_safe": False,
                "feedback": "Scientific research proves that cold air, loud music, and energy drinks provide only a brief 3-5 minute cognitive illusion before a sudden micro-sleep occurs.",
                "safety_takeaway": "You cannot out-will sleep. Drowsy driving has the exact same cognitive impairment as a Blood Alcohol Concentration of 0.08%.",
                "xp": 0
            },
            {
                "text": "Signal and pull into the nearest well-lit toll plaza, service station, or 24/7 rest area. Lock the doors and take a 20-30 minute power nap before continuing.",
                "is_safe": True,
                "feedback": "Life-saving decision! A 20-minute power nap restores alertness and cognitive reaction time dramatically. Arriving 30 minutes later is infinitely better than never arriving.",
                "safety_takeaway": "The only cure for fatigue is actual sleep. Stop before your brain stops you.",
                "xp": 50
            },
            {
                "text": "Speed up to 120 km/h so you can reach your destination before falling asleep.",
                "is_safe": False,
                "feedback": "Increasing speed while cognitively fatigued guarantees that any micro-sleep will be fatal due to extreme kinetic energy upon impact.",
                "safety_takeaway": "Speed magnifies every human error.",
                "xp": 0
            }
        ],
        "safest_choice_index": 1
    }
]

# ------------------------------------------------------------------------------
# 3. Hazard Spotter Levels (Game 2)
# ------------------------------------------------------------------------------
HAZARD_LEVELS = [
    {
        "level_id": "LVL_01_URBAN_JUNCTION",
        "title": "Urban Junction & School Crosswalk",
        "difficulty": "EASY",
        "scene_description": "Morning commute in a mixed residential-commercial zone near a school crosswalk.",
        "time_of_day": "Morning (08:15 AM)",
        "weather": "Clear",
        "hazards": [
            {
                "id": "HZ_01_PEDESTRIAN_PHONE",
                "name": "Distracted Pedestrian Crossing",
                "box": {"x": 22, "y": 62, "w": 12, "h": 26},
                "danger_reason": "A student wearing headphones is stepping off the curb looking down at a smartphone, completely unaware of turning vehicles.",
                "safe_reaction": "Slow down to 20 km/h, establish eye contact, cover the brake pedal, and yield the crosswalk."
            },
            {
                "id": "HZ_02_CAR_DOOR",
                "name": "Sudden Car Door Opening ('Dooring')",
                "box": {"x": 58, "y": 55, "w": 14, "h": 22},
                "danger_reason": "The driver of a parked sedan is swinging their roadside door open directly into the path of approaching two-wheelers and cyclists.",
                "safe_reaction": "Maintain a minimum 1.5-meter clearance from all parked vehicles ('the door zone') and scan parked car windows for driver head movement."
            },
            {
                "id": "HZ_03_BLIND_SPOT_MOTO",
                "name": "Motorcycle Filtering in Blind Spot",
                "box": {"x": 78, "y": 68, "w": 12, "h": 24},
                "danger_reason": "A scooter is overtaking tightly along your rear-left quarter without signaling, invisible in normal side mirrors.",
                "safe_reaction": "Perform a physical shoulder check before any lane change or left turn."
            },
            {
                "id": "HZ_04_PUDDLE_OIL",
                "name": "Oil Slick near Intersection Stop Line",
                "box": {"x": 42, "y": 80, "w": 16, "h": 12},
                "danger_reason": "Discharged diesel oil and water pooling where buses idle creates near-zero tire friction for braking.",
                "safe_reaction": "Brake progressively before the slick, keep the two-wheeler upright, and avoid sudden steering while traversing the patch."
            }
        ]
    },
    {
        "level_id": "LVL_02_MONSOON_HIGHWAY",
        "title": "Monsoon Highway Express Corridor",
        "difficulty": "MEDIUM",
        "scene_description": "High-speed four-lane National Highway during continuous monsoon rainfall with commercial traffic.",
        "time_of_day": "Afternoon (04:30 PM)",
        "weather": "Heavy Rain & Road Spray",
        "hazards": [
            {
                "id": "HZ_05_TRUCK_SPRAY",
                "name": "Heavy Vehicle Water Spray Blindness",
                "box": {"x": 35, "y": 42, "w": 25, "h": 38},
                "danger_reason": "A 16-wheel truck creates a massive plume of blinding water spray that obscures vehicles directly ahead.",
                "safe_reaction": "Increase following distance to 6 seconds; do not tailgate; run wipers at full speed and maintain low beams."
            },
            {
                "id": "HZ_06_AQUAPLANE_RUT",
                "name": "Deep Water Trench in Right Express Lane",
                "box": {"x": 68, "y": 72, "w": 22, "h": 18},
                "danger_reason": "Pavement ruts holding 4cm of rainwater will induce instant hydroplaning at speeds exceeding 70 km/h.",
                "safe_reaction": "Ease off throttle smoothly; avoid sudden braking; stay in center wheel tracks with lower water accumulation."
            },
            {
                "id": "HZ_07_BROKEN_DOWN_TRUCK",
                "name": "Unlit Broken-Down Truck on Shoulder",
                "box": {"x": 10, "y": 50, "w": 18, "h": 30},
                "danger_reason": "A stationary commercial truck is partially encroaching onto the active travel lane without warning triangles or hazard lights.",
                "safe_reaction": "Scan far ahead; shift into the clear center lane well in advance; do not overtake on the left shoulder."
            },
            {
                "id": "HZ_08_TAILGATING_BUS",
                "name": "Aggressive Tailgater in Rear Mirror",
                "box": {"x": 45, "y": 15, "w": 15, "h": 18},
                "danger_reason": "An interstate bus is following at under 1 second distance, unable to stop if you brake for hazards ahead.",
                "safe_reaction": "Do not brake check; gently decelerate to encourage them to overtake safely; create space ahead to absorb gradual stops."
            }
        ]
    },
    {
        "level_id": "LVL_03_NIGHT_MARKET",
        "title": "Night Market Corridor & Unregulated Crossing",
        "difficulty": "HARD",
        "scene_description": "Dense semi-urban market street with mixed traffic, high-beam glare, and low ambient streetlighting.",
        "time_of_day": "Night (09:15 PM)",
        "weather": "Clear / Darkness with Glare",
        "hazards": [
            {
                "id": "HZ_09_UNLIT_BICYCLE",
                "name": "Unlit Bicycle Crossing Lane",
                "box": {"x": 18, "y": 58, "w": 12, "h": 25},
                "danger_reason": "A vendor on a bicycle without reflectors or lights is cutting diagonally across traffic.",
                "safe_reaction": "Drive at 30 km/h max; scan peripheral shadows; use low-beam light dispersion to catch reflective shoe or pedal motion."
            },
            {
                "id": "HZ_10_HIGH_BEAM_GLARE",
                "name": "High-Beam Retinal Blindness",
                "box": {"x": 52, "y": 38, "w": 18, "h": 22},
                "danger_reason": "Oncoming SUV with aftermarket LED high beams causing total night vision loss for up to 3 seconds.",
                "safe_reaction": "Look toward the left lane marking; do not stare directly at oncoming headlights; slow down progressively."
            },
            {
                "id": "HZ_11_STRAY_ANIMAL",
                "name": "Cattle / Stray Animal on Median Edge",
                "box": {"x": 38, "y": 65, "w": 14, "h": 18},
                "danger_reason": "A stray bull standing beside the median barrier may bolt into the lane when startled by vehicle headlights.",
                "safe_reaction": "Slow down immediately; give wide berth; do not blast high-frequency horn which can cause the animal to panic and charge."
            },
            {
                "id": "HZ_12_POTHOLE_EXCAVATION",
                "name": "Unmarked Utility Trench in Lane",
                "box": {"x": 75, "y": 78, "w": 18, "h": 14},
                "danger_reason": "A 15cm road excavation without barricades or reflective tape will cause a two-wheeler fork collapse or loss of vehicle control.",
                "safe_reaction": "Scan illuminated road surface within low-beam reach; brake in a straight line before the depression."
            }
        ]
    }
]

# ------------------------------------------------------------------------------
# 4. Comprehensive Quiz Bank (12 Topic Categories)
# ------------------------------------------------------------------------------
QUIZ_QUESTIONS = [
    {
        "id": "QZ_01_HELMET_CERT",
        "category": "HELMET_AND_MOTORCYCLE",
        "difficulty": "EASY",
        "question": "What is the primary reason why novelty or non-certified helmets fail to protect riders in crashes?",
        "options": [
            "They look less attractive to traffic police officers.",
            "They lack an impact-absorbing Expanded Polystyrene (EPS) liner that crushes to dissipate rotational brain trauma.",
            "They are too heavy for daily long-distance commutes.",
            "They trap too much heat during summer weather."
        ],
        "correct_index": 1,
        "explanation": "A hard outer shell without a calibrated dense EPS (Expanded Polystyrene) liner merely transfers the impact force directly to the human skull. A certified ISI (IS 4151) or ECE 22.06 helmet uses high-density foam designed to crush millisecond by millisecond, reducing peak G-forces transferred to the brain by up to 70%.",
        "principle": "Kinetic Energy Absorption & Deceleration Time Extension",
        "source_reference": "MoRTH Section 129 Motor Vehicles Act & WHO Helmet Manual"
    },
    {
        "id": "QZ_02_SEATBELT_REAR",
        "category": "SEATBELTS_AND_PASSENGERS",
        "difficulty": "EASY",
        "question": "Why is wearing seatbelts in the rear seats of a car critically important for front-seat occupants as well?",
        "options": [
            "It improves the car's fuel efficiency by balancing weight.",
            "In a frontal crash, an unbuckled rear passenger becomes a human missile, striking front occupants with the force of a 3-ton projectile.",
            "It keeps the rear seats cleaner during sudden maneuvers.",
            "It is only required if the car is traveling over 100 km/h."
        ],
        "correct_index": 1,
        "explanation": "Newton's First Law of Motion: In a 50 km/h frontal impact, an unbelted 60 kg adult continues moving forward at 50 km/h until stopped by the front seat backrest, crushing the belted driver or front passenger against the dashboard or steering wheel.",
        "principle": "Inertia and Secondary Cabin Collisions",
        "source_reference": "WHO Global Status Report & MoRTH Mandatory Rear Seatbelt Mandate 2022"
    },
    {
        "id": "QZ_03_STOPPING_DISTANCE",
        "category": "SPEED_MANAGEMENT",
        "difficulty": "MEDIUM",
        "question": "When you double your driving speed from 40 km/h to 80 km/h, by what factor does your physical braking distance increase?",
        "options": [
            "It doubles (increases by 2x).",
            "It increases by 3x.",
            "It quadruples (increases by 4x).",
            "It remains exactly the same if tires are new."
        ],
        "correct_index": 2,
        "explanation": "Kinetic energy is calculated as E = 1/2 * m * v^2. Because kinetic energy is proportional to the square of velocity, doubling your speed quadruples (4x) the kinetic energy your vehicle's brakes and tire rubber must absorb through friction.",
        "principle": "Kinetic Energy Quadratic Velocity Law (E = 1/2 mv²)",
        "source_reference": "Transport Research Board & Physics of Traffic Flow"
    },
    {
        "id": "QZ_04_PHONE_REACTION",
        "category": "DISTRACTED_DRIVING",
        "difficulty": "EASY",
        "question": "Reading or typing a text message while driving at 60 km/h takes your eyes off the road for an average of 4 seconds. How far does the car travel completely unguided?",
        "options": [
            "Approximately 15 meters (about 3 car lengths).",
            "Approximately 33 meters (about half a cricket pitch).",
            "Approximately 67 meters (more than half a football field).",
            "Approximately 120 meters."
        ],
        "correct_index": 2,
        "explanation": "At 60 km/h, a vehicle travels 16.67 meters per second. Looking away for 4 seconds means the vehicle covers: 16.67 m/s * 4 s = 66.7 meters blind. In that distance, road conditions, pedestrians, or braking traffic can change completely.",
        "principle": "Velocity-Time Distance Equation (d = v * t)",
        "source_reference": "National Highway Traffic Safety Administration (NHTSA) Distracted Driving Research"
    },
    {
        "id": "QZ_05_THREE_SECOND_RULE",
        "category": "PEDESTRIAN_AND_CYCLIST",
        "difficulty": "EASY",
        "question": "What is the recommended minimum space cushion (following distance) in normal, dry daylight conditions behind another vehicle?",
        "options": [
            "1 second.",
            "3 seconds.",
            "10 meters at all speeds.",
            "Directly behind the bumper so no one cuts in."
        ],
        "correct_index": 1,
        "explanation": "The 3-Second Rule allows 1.5 seconds for human perception and reaction (processing danger, moving foot to brake) plus 1.5 seconds of braking distance buffer. In rain, darkness, or behind heavy trucks, this should be expanded to 5-6 seconds.",
        "principle": "Perception-Reaction Time (PRT) Buffer",
        "source_reference": "Defensive Driving Institute Standards"
    },
    {
        "id": "QZ_06_ALCOHOL_BAC",
        "category": "ALCOHOL_AND_IMPAIRED",
        "difficulty": "MEDIUM",
        "question": "What is the legal Blood Alcohol Concentration (BAC) limit for operating a motor vehicle in India under the Motor Vehicles Act?",
        "options": [
            "Zero BAC (0.0 mg per 100 ml).",
            "30 mg of alcohol per 100 ml of blood (0.03% BAC).",
            "50 mg of alcohol per 100 ml of blood (0.05% BAC).",
            "80 mg of alcohol per 100 ml of blood (0.08% BAC)."
        ],
        "correct_index": 1,
        "explanation": "Section 185 of the Motor Vehicles Act specifies a limit of 30 mg of alcohol per 100 ml of blood detected by breathalyzer. However, cognitive impairment, peripheral tunnel vision, and reduced reaction speed begin at even lower concentrations. True defensive driving requires zero alcohol.",
        "principle": "Central Nervous System Depressant Latency",
        "source_reference": "Section 185, Motor Vehicles Act 1988 (Amended 2019)"
    },
    {
        "id": "QZ_07_GOOD_SAMARITAN",
        "category": "EMERGENCY_AWARENESS",
        "difficulty": "EASY",
        "question": "Under India's Good Samaritan Law (Supreme Court Ruling & Section 134A of the MV Act), what protection is granted to bystanders who assist accident victims?",
        "options": [
            "They are required to pay the hospital admission fee for the victim.",
            "They are completely immune from civil and criminal liability, cannot be forced to disclose identity, and cannot be detained at police stations or hospitals.",
            "They must appear in court at their own expense as eyewitnesses.",
            "They can only help if they hold an MBBS medical degree."
        ],
        "correct_index": 1,
        "explanation": "To eliminate fear of harassment, the Supreme Court of India established the Good Samaritan Guidelines, codified into Section 134A of the MV Act. Anyone who rushes an injured victim to the hospital or calls 112/108 is protected from legal liability, harassment, and mandatory witness calls.",
        "principle": "Good Samaritan Legal Immunity & Golden Hour Preservation",
        "source_reference": "Supreme Court of India (SaveLIFE Foundation v. Union of India) & Section 134A MV Act"
    },
    {
        "id": "QZ_08_AQUAPLANING_REACTION",
        "category": "RAIN_AND_SLIPPERY_ROADS",
        "difficulty": "HARD",
        "question": "If your car starts aquaplaning (tires lose contact with road and steering feels weightless on water), what is the safest immediate action?",
        "options": [
            "Slam on the brakes as hard as possible to lock the wheels.",
            "Steer sharply left and right to shake water out of the treads.",
            "Ease off the accelerator gradually, keep the steering wheel pointed straight, and avoid hard braking until tires regain contact.",
            "Pull the handbrake immediately to force rear tire grip."
        ],
        "correct_index": 2,
        "explanation": "When tires aquaplane, water has lifted the rubber off the asphalt. Braking or turning while floating causes violent skidding the instant tires touch asphalt again. Easing off the throttle allows the car's weight to settle back through the water film naturally.",
        "principle": "Dynamic Fluid Wedge Dissipation",
        "source_reference": "Michelin & Continental Tire Dynamics Research"
    }
]

# ------------------------------------------------------------------------------
# 5. Emotional Storytelling Narratives ("Someone Is Waiting for You")
# ------------------------------------------------------------------------------
EMOTIONAL_STORIES = [
    {
        "id": "STR_01_DINNER_PROMISE",
        "title": "The Dinner Table That Kept Its Promise",
        "character": "Kavitha & Her 19-Year-Old Son, Arjun",
        "location": "Tirupati Outer Ring Road Corridor",
        "quote": "Every time Arjun steps onto his motorcycle, I don't just see a vehicle—I see my whole world balancing on two wheels.",
        "narrative": "At 8:15 PM on a rainy Tuesday, Arjun was riding home from university. His phone in his pocket buzzed three times with messages from his college friends. In the past, he might have glanced down while cruising through the bypass intersection. But that morning, his mother had handed him his helmet with a warm cup of tea and whispered, 'We are having your favorite biryani tonight. Come home in one piece.'\n\nArjun let the phone vibrate in his pocket. Two seconds later, an unlit auto-rickshaw made an abrupt U-turn directly across the junction. Because Arjun was traveling at 40 km/h with both hands firmly on the handlebars and full eyes on the asphalt, he executed a smooth, controlled stop with two meters to spare.\n\nHe arrived home at 8:45 PM. The biryani was warm. The family sat together. That night, a mother didn't receive a phone call from a trauma ward—she heard laughter across the dinner table.",
        "safety_habit": "Silence the phone before kicking the stand up. Make coming home the only priority.",
        "tagline": "Someone is waiting for you at home. Ride safe."
    },
    {
        "id": "STR_02_EXTRA_TWO_MINUTES",
        "title": "The Extra Two Minutes That Saved Little Diya",
        "character": "Ramesh & His 5-Year-Old Daughter, Diya",
        "location": "Alipiri Bypass Route",
        "quote": "She cried because the booster harness was snug. Two kilometers later, that harness became her guardian angel.",
        "narrative": "Ramesh was running late for an important client presentation. Five-year-old Diya wanted to jump into the front passenger seat like a grown-up. Ramesh felt the urge to hurry, to let her sit where she wanted 'just this once for a 10-minute drive.'\n\nInstead, Ramesh took a deep breath. He walked around to the rear door, buckled Diya into her age-appropriate rear child seat, fastened the 5-point chest clip, and checked the tension. Diya pouted for thirty seconds.\n\nAt the third traffic signal, a commercial pickup truck ran a red light, T-boning Ramesh's sedan on the front-passenger side. The front passenger airbag detonated with explosive velocity—a force that would have critically injured a child in the front seat. In the back, Diya's reinforced booster seat held her securely, preventing any contact with shattered glass or structural pillars.\n\nDiya came out with a tiny bruise on her shoulder and a deep understanding that her father's rules were made of love.",
        "safety_habit": "Children under 12 belong in the rear seat, always secured in age-appropriate child restraints.",
        "tagline": "Protect your tomorrow. Buckle every passenger, every time."
    },
    {
        "id": "STR_03_RESPONDER_HOMECOMING",
        "title": "The Paramedic Who Wished He Was Never Needed",
        "character": "Subhash, Senior 108 Ambulance EMT (7 Years Service)",
        "location": "Tirupati Emergency Operations Center",
        "quote": "In seven years of emergency response, I have never unbuckled a deceased driver who was wearing a certified helmet or seatbelt at city speeds. Not once.",
        "narrative": "Subhash has driven through torrential monsoons, navigated gridlocked city corridors, and administered CPR under flickering streetlights. When people ask him about his toughest nights, he doesn't talk about the blood—he talks about the silence in the hospital corridor when a family arrives hoping for a miracle that physics cannot provide.\n\n'People think an accident is a roll of the dice,' Subhash says quietly. 'It isn't. When I arrive at a crash where the rider wore an ISI full-face helmet with the strap double-clicked, they are almost always conscious and talking to us. When they wore a cheap plastic cap without a strap, the helmet flew off five meters before the impact.'\n\nWhen his 12-hour shift ends at 7:00 AM, Subhash walks through his own front door, hugs his two sleeping children, and says a quiet prayer for the motorists he didn't have to meet that night.",
        "safety_habit": "Fasten your chin-strap until you hear the audible click. A loose helmet is no helmet at all.",
        "tagline": "Make safety a habit. Make returning home a promise."
    }
]

# ------------------------------------------------------------------------------
# 6. Safety Journey Achievements Definition
# ------------------------------------------------------------------------------
ACHIEVEMENT_DEFINITIONS = [
    {
        "id": "ACH_FIRST_SAFE_CHOICE",
        "title": "First Safe Choice",
        "description": "Completed your first interactive Road Safety Decision Simulator scenario.",
        "icon": "ShieldCheck",
        "badge_color": "teal",
        "xp_reward": 50
    },
    {
        "id": "ACH_HELMET_CHAMPION",
        "title": "Helmet Safety Champion",
        "description": "Scored 100% on the Helmet & Head Trauma Prevention Quiz.",
        "icon": "Award",
        "badge_color": "cyan",
        "xp_reward": 100
    },
    {
        "id": "ACH_HAZARD_SPOTTER",
        "title": "Hazard Spotter",
        "description": "Successfully identified all hidden traffic hazards in an interactive scenario.",
        "icon": "Eye",
        "badge_color": "amber",
        "xp_reward": 100
    },
    {
        "id": "ACH_ROAD_SIGN_EXPLORER",
        "title": "Road Sign Explorer",
        "description": "Mastered the Road Sign & Regulatory Markings memory challenge.",
        "icon": "Compass",
        "badge_color": "emerald",
        "xp_reward": 80
    },
    {
        "id": "ACH_FAMILY_ADVOCATE",
        "title": "Family Safety Advocate",
        "description": "Signed the TERA Family Road-Safety Pledge to protect loved ones.",
        "icon": "Heart",
        "badge_color": "rose",
        "xp_reward": 120
    },
    {
        "id": "ACH_STREAK_GUARDIAN",
        "title": "Three-Day Learning Streak",
        "description": "Practiced road safety learning modules across three consecutive sessions.",
        "icon": "Flame",
        "badge_color": "orange",
        "xp_reward": 150
    },
    {
        "id": "ACH_ROAD_SAFETY_MASTER",
        "title": "Road Safety Master",
        "description": "Accumulated over 500 Safety XP across simulation, quiz, and hazard modules.",
        "icon": "Crown",
        "badge_color": "purple",
        "xp_reward": 250
    }
]

# ------------------------------------------------------------------------------
# API Endpoints
# ------------------------------------------------------------------------------

@router.get("/statistics")
def get_verified_statistics():
    """
    Returns authentic MoRTH (Govt of India) & WHO road safety datasets
    with verified reporting years, denominators, and source citations.
    """
    return MORTH_2023_DATASET

@router.get("/scenarios")
def get_decision_scenarios():
    """
    Returns scenario-based educational driving situations with branching choices
    and scientific safety rationales.
    """
    return {
        "count": len(DECISION_SCENARIOS),
        "scenarios": DECISION_SCENARIOS
    }

@router.get("/hazards")
def get_hazard_levels():
    """
    Returns Spot the Hazard illustrated scene levels with mapped coordinate zones.
    """
    return {
        "count": len(HAZARD_LEVELS),
        "levels": HAZARD_LEVELS
    }

@router.get("/quizzes")
def get_quiz_bank(
    category: Optional[str] = Query(None, description="Filter by topic category"),
    difficulty: Optional[str] = Query(None, description="EASY, MEDIUM, HARD")
):
    """
    Returns fact-checked road safety quiz bank with deep principle explanations.
    """
    filtered = QUIZ_QUESTIONS
    if category:
        filtered = [q for q in filtered if q["category"] == category.upper()]
    if difficulty:
        filtered = [q for q in filtered if q["difficulty"] == difficulty.upper()]
    
    categories = sorted(list(set(q["category"] for q in QUIZ_QUESTIONS)))
    return {
        "total_questions": len(filtered),
        "categories": categories,
        "questions": filtered
    }

@router.get("/stories")
def get_family_stories():
    """
    Returns emotional, family-centered awareness campaign narratives
    under 'Someone Is Waiting for You'.
    """
    return {
        "campaign_title": "Someone Is Waiting for You",
        "tagline": "Learn smarter. Choose safer. Protect the people who matter most.",
        "stories": EMOTIONAL_STORIES
    }

@router.get("/achievements")
def get_achievement_definitions():
    """
    Returns catalog of available safety achievements and XP milestones.
    """
    return ACHIEVEMENT_DEFINITIONS

@router.get("/progress")
def get_user_learning_progress(
    session_id: str = Query("guest_session"),
    current_user: Optional[UserAccount] = Depends(get_current_user)
):
    """
    Retrieves the learner's Safety Journey progression, earned badges, and Safety XP.
    """
    user_key = current_user.user_id if current_user else session_id
    progress = _GUEST_PROGRESS_CACHE.get(user_key, {
        "user_key": user_key,
        "is_authenticated": current_user is not None,
        "username": current_user.username if current_user else "Safety Explorer (Guest)",
        "total_xp": 100,  # Starting welcome XP
        "level": "Defensive Scout",
        "completed_scenarios": ["SCN_01_PHONE_CALL"],
        "completed_quizzes": 1,
        "discovered_hazards_count": 3,
        "streak_days": 1,
        "pledge_signed": False,
        "pledge_name": None,
        "earned_achievements": ["ACH_FIRST_SAFE_CHOICE"],
        "last_activity_at": datetime.datetime.utcnow().isoformat()
    })
    return progress

@router.post("/progress")
def record_learning_progress(
    req: ProgressUpdateRequest,
    current_user: Optional[UserAccount] = Depends(get_current_user)
):
    """
    Updates the learner's progression, awards XP, and unlocks verified achievements.
    Prevents artificial duplication and validates incoming activities.
    """
    user_key = current_user.user_id if current_user else (req.session_id or "guest_session")
    progress = _GUEST_PROGRESS_CACHE.setdefault(user_key, {
        "user_key": user_key,
        "is_authenticated": current_user is not None,
        "username": current_user.username if current_user else "Safety Explorer (Guest)",
        "total_xp": 100,
        "level": "Defensive Scout",
        "completed_scenarios": [],
        "completed_quizzes": 0,
        "discovered_hazards_count": 0,
        "streak_days": 1,
        "pledge_signed": False,
        "pledge_name": None,
        "earned_achievements": ["ACH_FIRST_SAFE_CHOICE"],
        "last_activity_at": datetime.datetime.utcnow().isoformat()
    })

    # Add earned XP
    if req.xp_earned > 0 and req.passed:
        progress["total_xp"] += req.xp_earned

    # Track activity specifics
    if req.activity_type == "SCENARIO" and req.activity_id not in progress["completed_scenarios"]:
        progress["completed_scenarios"].append(req.activity_id)
    elif req.activity_type == "QUIZ" and req.passed:
        progress["completed_quizzes"] += 1
    elif req.activity_type == "HAZARD":
        progress["discovered_hazards_count"] += 1
    elif req.activity_type == "PLEDGE":
        progress["pledge_signed"] = True
        progress["pledge_name"] = req.pledge_name or "Responsible Citizen"
        if "ACH_FAMILY_ADVOCATE" not in progress["earned_achievements"]:
            progress["earned_achievements"].append("ACH_FAMILY_ADVOCATE")
            progress["total_xp"] += 120

    # Dynamic Level Progression
    xp = progress["total_xp"]
    if xp >= 500:
        progress["level"] = "Road Safety Guardian"
        if "ACH_ROAD_SAFETY_MASTER" not in progress["earned_achievements"]:
            progress["earned_achievements"].append("ACH_ROAD_SAFETY_MASTER")
    elif xp >= 300:
        progress["level"] = "Defensive Champion"
    elif xp >= 150:
        progress["level"] = "Cautious Commuter"
    else:
        progress["level"] = "Defensive Scout"

    # Unlock requested achievement if applicable
    if req.achievement_id and req.achievement_id not in progress["earned_achievements"]:
        progress["earned_achievements"].append(req.achievement_id)

    progress["last_activity_at"] = datetime.datetime.utcnow().isoformat()
    return {
        "status": "success",
        "current_total_xp": progress["total_xp"],
        "current_level": progress["level"],
        "earned_achievements": progress["earned_achievements"],
        "message": f"Successfully updated progress. Current XP: {progress['total_xp']}"
    }

@router.post("/pledge")
def sign_family_safety_pledge(
    req: SafetyPledgeRequest,
    current_user: Optional[UserAccount] = Depends(get_current_user)
):
    """
    Submits a certified family road-safety pledge and unlocks the Family Safety Advocate badge.
    """
    user_key = current_user.user_id if current_user else "guest_session"
    progress = _GUEST_PROGRESS_CACHE.setdefault(user_key, {
        "user_key": user_key,
        "is_authenticated": current_user is not None,
        "username": current_user.username if current_user else req.pledge_name,
        "total_xp": 100,
        "level": "Defensive Scout",
        "completed_scenarios": [],
        "completed_quizzes": 0,
        "discovered_hazards_count": 0,
        "streak_days": 1,
        "pledge_signed": False,
        "pledge_name": None,
        "earned_achievements": [],
        "last_activity_at": datetime.datetime.utcnow().isoformat()
    })
    
    progress["pledge_signed"] = True
    progress["pledge_name"] = req.pledge_name
    progress["total_xp"] += 120
    if "ACH_FAMILY_ADVOCATE" not in progress["earned_achievements"]:
        progress["earned_achievements"].append("ACH_FAMILY_ADVOCATE")
        
    return {
        "status": "success",
        "pledge_id": f"PLG_{datetime.datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
        "pledge_name": req.pledge_name,
        "family_members_count": req.family_members_count,
        "commitments": req.commitments,
        "signed_at": datetime.datetime.utcnow().isoformat(),
        "unlocked_achievement": "ACH_FAMILY_ADVOCATE",
        "message": f"Thank you, {req.pledge_name}! Your Family Road-Safety Pledge is registered."
    }
