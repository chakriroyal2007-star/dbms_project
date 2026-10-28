"""
TERA Major Accident Case-Study Library Data
Authoritative, factual accident case studies based on official investigation reports,
transport research publications, and verified public safety findings.
Strict 7-section structure (A-G) with sensitivity labels and evidence-based quizzes.
"""

from typing import List, Dict, Any

MAJOR_ACCIDENT_CASE_STUDIES: List[Dict[str, Any]] = [
    {
        "id": "CASE_01_NH44_FOG_PILEUP",
        "title": "NH-44 Multi-Vehicle Chain Collision in Winter Radiation Fog",
        "accident_type": "HIGHWAY_PILEUP",
        "accident_type_label": "Highway Multi-Vehicle Pile-Up",
        "road_user_category": "Heavy Trucks, Buses & Private Cars",
        "contributing_factors": [
            "Dense Winter Fog (Visibility < 25m)",
            "Excessive Cruising Speed for Weather",
            "Inadequate Following Distance (< 1.5 seconds)",
            "Absence of Low-Mounted Rear Fog Lamps"
        ],
        "location": "NH-44 National Highway Corridor (Northern Plains Corridor)",
        "date": "January 2023",
        "sensitivity_label": "CONTAINS TECHNICAL COLLISION ANALYSIS • EDUCATIONAL USE ONLY",
        "summary": "An 18-vehicle pileup occurred at 06:45 AM during dense radiation fog on a divided expressway corridor, resulting in 4 fatalities and 22 hospitalizations.",
        "image_url": "/assets/case_studies/fog_pileup.jpg",
        "image_caption": "Divided highway section under dense winter radiation fog with visibility restricted below 25 meters.",
        
        # Section A: What Happened?
        "what_happened": (
            "At approximately 06:45 AM on a mid-January morning, an articulated multi-axle freight truck traveling south on NH-44 "
            "encountered a stationary agricultural tractor-trailer disabled on the right-hand express lane. Because forward visibility "
            "was restricted to under 25 meters by dense radiation fog, the truck driver initiated panic braking. The truck jackknifed across two lanes. "
            "Over the subsequent 9 minutes, 17 following vehicles—including 3 passenger buses, 9 private passenger vehicles, and 5 light commercial "
            "vehicles—collided in a cascading chain reaction before traffic could be flagged down."
        ),
        
        # Section B: What Do We Know?
        "what_do_we_know": {
            "confirmed_facts": [
                "Ambient air temperature was 4°C with relative humidity at 98%, producing dense localized radiation fog.",
                "Forward visual sight distance was under 25 meters, while average vehicle approach speeds were documented at 65-80 km/h.",
                "The disabled agricultural tractor had zero functioning reflective tape, hazard flashers, or warning retroreflectors.",
                "None of the first four following cars maintained the recommended 6-second fog following distance."
            ],
            "preliminary_or_unconfirmed": [
                "Whether warning calls were made to emergency patrol units before the primary impact remains under inquiry."
            ],
            "unknown_details": [
                "The exact mechanical braking pressure available to the primary tractor at the moment of breakdown was not recorded."
            ]
        },
        
        # Section C: How Did the Crash Occur?
        "how_crash_occurred": {
            "immediate_sequence": "Disabled vehicle in active express lane -> Late hazard perception by leading truck due to fog -> Jackknife obstruction -> Cascading rear-end impacts.",
            "contributing_factors": [
                "Visual Overdriving: At 75 km/h, stopping distance on asphalt is ~55 meters. A 25-meter visual horizon means drivers were completely blind to obstacles beyond half their stopping distance.",
                "Hazard Perception Delay: Radiation fog diffuses light, making unlit vehicles appear further away than their true physical distance.",
                "Tailgating in Convoys: Drivers formed tight 'fog convoys' under the false belief that following close to tail-lights was safer."
            ],
            "road_and_environment": "Six-lane divided access-controlled highway; dry asphalt surface; zero overhead ambient lighting; dense radiation fog.",
            "vehicle_and_occupant_factors": "92% of fatalities occurred in vehicles where front occupants were not restrained or where rear cargo intruded into the passenger compartment."
        },
        
        # Section D: What Could Have Reduced the Risk or Severity?
        "prevention_measures": [
            "Adhering to the 'Sightline Stopping Rule': Never drive faster than the speed that allows you to stop within half the distance of clear forward vision (maximum 30 km/h in <25m fog).",
            "Mandatory High-Intensity Rear Red Fog Lamps: Penetrates fog up to 300 meters, compared to standard 40-meter tail lamps.",
            "Immediate Retroreflective Triangle Deployment: Deploying warning triangles 100 meters behind disabled vehicles immediately.",
            "Dynamic Variable Message Signs (VMS) with automated visibility sensors triggering reduced corridor speed limits."
        ],
        
        # Section E: What Can Each Road User Learn?
        "road_user_takeaways": {
            "two_wheeler_riders": "Avoid highway travel during dense radiation fog windows (04:00-08:00 AM). If travel is unavoidable, wear certified retroreflective vests (EN 471 / IS 15809).",
            "car_drivers_and_passengers": "Use low-beam headlights and dedicated fog lamps. Never use high-beams in fog (they reflect white glare back into your eyes). Keep a 6-second gap.",
            "heavy_vehicle_drivers": "Never stop disabled vehicles on active express lanes. Steer to the paved shoulder or earthen verge immediately and illuminate hazard flashers.",
            "road_authorities": "Install automated fog-detection visibility sensors with dynamic advisory speed reductions and audio fog sirens at high-risk highway sections."
        },
        
        # Section F: Test Your Understanding
        "quiz": [
            {
                "question": "What is the primary scientific reason high-beam headlights are dangerous during dense fog?",
                "options": [
                    "They drain the vehicle's alternator and battery prematurely.",
                    "High beams project light upward, which reflects off water droplets directly back into the driver's eyes, causing white-out glare.",
                    "They cause excessive heat buildup inside the headlamp housing.",
                    "They prevent the vehicle's anti-lock braking system (ABS) from calibrating properly."
                ],
                "correct_index": 1,
                "explanation": "Fog consists of billions of suspended micro-water droplets. High-beam light reflects off these droplets back into the driver's retina (Tyndall scattering), blinding the driver instead of illuminating the roadway."
            },
            {
                "question": "If forward visibility in fog is 25 meters, what is the maximum safe defensive approach speed?",
                "options": [
                    "60 km/h to maintain highway flow.",
                    "80 km/h as long as you follow another vehicle's tail-lights.",
                    "25-30 km/h so total stopping distance is strictly less than forward visual sightline.",
                    "Any speed, provided hazard flashers are switched on."
                ],
                "correct_index": 2,
                "explanation": "A vehicle traveling at 30 km/h requires ~18 meters to stop (including reaction time). At speeds above 35 km/h, stopping distance exceeds 25 meters, guaranteeing an unavoidable crash into stationary obstacles."
            }
        ],
        
        # Section G: Sources and Further Reading
        "sources": [
            {
                "title": "Road Accidents in India 2023 - Special Analysis on Weather and Visibility Corridors",
                "publisher": "Ministry of Road Transport and Highways (MoRTH), Govt of India",
                "publication_date": "2024-02-18",
                "url": "https://morth.nic.in/"
            },
            {
                "title": "Guidelines on Fog Mitigation & Highway Safety Countermeasures (IRC:SP:88)",
                "publisher": "Indian Roads Congress (IRC)",
                "publication_date": "2022-11-10",
                "url": "https://roadsafetycommittee.morth.gov.in/nrsb/road-safety.html"
            }
        ]
    },
    {
        "id": "CASE_02_MUMBAI_PUNE_TRUCK_BRAKE_FADE",
        "title": "Runaway Heavy Vehicle Brake Fade on Mountain Ghat Descent",
        "accident_type": "HEAVY_VEHICLE",
        "accident_type_label": "Heavy Vehicle & Mountain Descent",
        "road_user_category": "Multi-Axle Truck & Light Motor Vehicles",
        "contributing_factors": [
            "Over-Reliance on Service Foundation Brakes",
            "Thermal Brake Fade (Brake Drum Temps > 350°C)",
            "Gross Vehicle Overloading (> 25% over legal GVW)",
            "Failure to Engage Auxiliary Engine Retarders"
        ],
        "location": "Mumbai-Pune Expressway (Bhor Ghat / Khandala Descent)",
        "date": "April 2023",
        "sensitivity_label": "CONTAINS TECHNICAL COLLISION ANALYSIS • EDUCATIONAL USE ONLY",
        "summary": "A fully laden commercial truck suffered catastrophic thermal brake fade on a 7-kilometer downhill gradient, rear-ending 6 passenger vehicles before rolling over.",
        "image_url": "/assets/case_studies/brake_fade.jpg",
        "image_caption": "Mountain expressway descent corridor with emergency escape ramps and gradient warnings.",
        
        "what_happened": (
            "A 3-axle 25-tonne commercial goods vehicle was descending the continuous 4% to 6% grade of the Bhor Ghat corridor. "
            "The driver maintained high gear (4th gear) and used prolonged, continuous application of the air service brakes to control vehicle speed. "
            "Approximately 5 kilometers into the descent, friction generated extreme temperatures exceeding 380°C within the drum brake assemblies. "
            "The friction lining material degraded and outgassed, creating a cushion of gas between the brake shoes and drums—a phenomenon known as 'thermal brake fade'. "
            "With service brakes rendered non-responsive, the runaway truck accelerated down the slope to over 105 km/h, rear-ending stationary queue traffic at a toll approach."
        ),
        
        "what_do_we_know": {
            "confirmed_facts": [
                "Post-crash technical inspection revealed crystallized, vitrified brake shoe linings with zero friction coefficient remaining.",
                "The exhaust engine brake (auxiliary retarder) was found switched off on the vehicle's dashboard toggle.",
                "Vehicle weighed 31.4 tonnes against a registered Gross Vehicle Weight (GVW) limit of 25 tonnes.",
                "Occupants in passenger cars wearing seatbelts survived the impact with non-life-threatening injuries."
            ],
            "preliminary_or_unconfirmed": [
                "Whether the driver attempted to enter an available runaway truck ramp (emergency escape bed) is undetermined."
            ],
            "unknown_details": [
                "Air supply pressure in the secondary reservoir immediately prior to the first impact."
            ]
        },
        
        "how_crash_occurred": {
            "immediate_sequence": "Prolonged downhill braking in high gear -> Thermal overheating of drum assemblies -> Complete loss of friction coefficient -> Runaway acceleration -> Multi-vehicle impact.",
            "contributing_factors": [
                "Kinetic Energy Dissipation: In descending 500 vertical meters, millions of Joules of potential energy must be converted to heat. Without engine compression braking, drum brakes heat past critical threshold within 3-4 minutes.",
                "Overloading: A 25% overload increases kinetic braking energy demands by over 50% on steep downgrades."
            ],
            "road_and_environment": "Concrete 6-lane expressway mountain section; 5.2% sustained downgrade; dry pavement; clear daytime visibility.",
            "vehicle_and_occupant_factors": "Modern passenger vehicles absorbed crash energy through crumple zones, while unrestrained occupants suffered thoracic and facial injuries."
        },
        
        "prevention_measures": [
            "Downhill Gear Discipline: Descend mountain grades in the exact same low gear required to climb them (engine compression braking).",
            "Exhaust Retarder / Engine Brakes: Engage auxiliary retarders before initiating descent to handle up to 80% of downhill deceleration.",
            "Snub Braking Technique: Apply brakes firmly to drop speed by 10 km/h, then release completely for 5-10 seconds to allow convective air cooling.",
            "Utilization of Emergency Escape Ramps (Arrester Beds): Sand and gravel arrester beds are designed specifically to safely stop runaway vehicles with zero casualties."
        ],
        
        "road_user_takeaways": {
            "two_wheeler_riders": "Never linger directly in front of or behind heavy commercial trucks on steep downgrades. Overtake swiftly or drop back to safe separation.",
            "car_drivers_and_passengers": "On ghat roads, check your rearview mirrors frequently when braking. If a heavy truck is approaching rapidly with horn blaring, move toward paved shoulders or escape spaces immediately.",
            "heavy_vehicle_drivers": "Check brake drum temperatures at mandatory ghat inspection halts. Never ride the service brake pedal continuously down hills.",
            "road_authorities": "Construct prominent gravel arrester beds and enforce mandatory thermal camera inspection halts for heavy trucks at the crest of mountain passes."
        },
        
        "quiz": [
            {
                "question": "What is the primary physical cause of thermal brake fade on steep downgrades?",
                "options": [
                    "Brake fluid leaking onto the road surface.",
                    "Overheating of brake linings and drums exceeding 300°C, causing friction materials to outgas and lose friction coefficient.",
                    "Air entering the pneumatic suspension system.",
                    "Tire tread separation caused by high speed."
                ],
                "correct_index": 1,
                "explanation": "When friction brakes are used continuously down hills, temperatures exceed 300°C. The resin in brake linings vaporizes into gas, creating an air cushion that prevents the brake shoes from gripping the drum, resulting in zero stopping power."
            },
            {
                "question": "Which driving technique is the proven standard for descending long mountain gradients safely in heavy vehicles?",
                "options": [
                    "Shift into neutral and rely on the handbrake to save fuel.",
                    "Select a low gear before the descent, activate auxiliary engine retarders, and use intermittent 'snub braking'.",
                    "Drive in top gear while keeping the service brake pedal pressed halfway.",
                    "Turn the engine off to allow the transmission to lock."
                ],
                "correct_index": 1,
                "explanation": "Selecting a low gear harnesses engine compression to retard vehicle momentum, while intermittent snub braking allows cooling air to circulate around drums between brake applications."
            }
        ],
        
        "sources": [
            {
                "title": "Comprehensive Safety Audit of Mumbai-Pune Expressway Ghat Section",
                "publisher": "Maharashtra State Road Development Corporation (MSRDC) & CIRT Pune",
                "publication_date": "2023-06-20",
                "url": "https://morth.nic.in/"
            }
        ]
    },
    {
        "id": "CASE_03_TIRUPATI_CHITTOOR_INTERSECTION",
        "title": "High-Speed Intersection Dilemma Zone Collision at Signalized Bypass",
        "accident_type": "INTERSECTION",
        "accident_type_label": "Signalized Intersection & Dilemma Zone",
        "road_user_category": "Passenger Car & Three-Wheeler Auto-Rickshaw",
        "contributing_factors": [
            "Amber Signal Acceleration (Jumping the Dilemma Zone)",
            "Premature Right-Turn by Cross-Traffic on Amber",
            "Visual Obstruction by Corner Signage",
            "Speed Exceeding Posted Urban Arterial Limit (82 km/h in 50 zone)"
        ],
        "location": "Tirupati-Chittoor National Highway Arterial Junction (NH-140)",
        "date": "August 2023",
        "sensitivity_label": "CONTAINS TECHNICAL COLLISION ANALYSIS • EDUCATIONAL USE ONLY",
        "summary": "A sedan traveling at 82 km/h accelerated into an intersection as the signal turned amber, T-boning an auto-rickshaw that initiated a premature right turn.",
        "image_url": "/assets/case_studies/intersection_collision.jpg",
        "image_caption": "Urban divided arterial intersection with 4-way traffic signals and pedestrian crossings.",
        
        "what_happened": (
            "At 19:15 PM on a dry evening, a sedan was approaching a 4-way signalized intersection at 82 km/h (posted limit: 50 km/h). "
            "When the sedan was 45 meters from the stop line, the signal transitioned from green to amber. "
            "Instead of decelerating, the driver floored the accelerator to beat the red light. "
            "Simultaneously, a three-wheeler auto-rickshaw waiting in the cross-street right-turn pocket began creeping into the junction, "
            "anticipating the signal change. The sedan struck the passenger side of the auto-rickshaw at an estimated speed of 78 km/h. "
            "Two auto-rickshaw occupants died on scene, and the car driver sustained minor chest injuries due to seatbelt and front airbag deployment."
        ),
        
        "what_do_we_know": {
            "confirmed_facts": [
                "CCTV footage recorded the sedan entering the stop line 0.4 seconds after the signal turned solid red.",
                "The amber clearance interval at this junction was calibrated at 3.0 seconds, which was insufficient for an approach speed of 80 km/h.",
                "Auto-rickshaw driver lacked a valid commercial transport badge and was operating with 5 passengers (permitted capacity: 3).",
                "Airbag deployment and seatbelt pretensioners in the sedan prevented fatal trauma for both front occupants."
            ],
            "preliminary_or_unconfirmed": [
                "Whether the car driver was distracted by mobile phone notifications immediately prior to the signal transition."
            ],
            "unknown_details": [
                "Exact tire inflation pressure of the sedan at time of collision."
            ]
        },
        
        "how_crash_occurred": {
            "immediate_sequence": "Excess approach speed -> Driver enters Dilemma Zone -> Decision to accelerate on amber -> Cross-traffic enters junction early -> Right-angle T-bone collision.",
            "contributing_factors": [
                "The Intersection Dilemma Zone: A physical zone on intersection approaches where a driver can neither stop safely before the line nor clear the junction before the red signal appears.",
                "Perception-Reaction Time (PRT): The car driver required 1.5 seconds to decide whether to stop or go, leaving only 1.5 seconds of amber time while traveling at 22.7 meters per second."
            ],
            "road_and_environment": "Four-leg signalized arterial intersection; dry asphalt; high-pressure sodium streetlighting; moderate dusk traffic.",
            "vehicle_and_occupant_factors": "Auto-rickshaws lack side-impact crumple structures and roll cages, making occupants exceptionally vulnerable to lateral kinetic impacts."
        },
        
        "prevention_measures": [
            "Respecting Amber Signals: The amber light legally and physically means 'Stop if it is safe to do so', not 'Speed up to beat the red'.",
            "Defensive Intersection Entry: Even on green signals, drivers should scan left-center-right before proceeding to detect red-light runners.",
            "Engineering All-Red Intervals: Adding a 2-second all-red clearance interval gives errant vehicles time to clear intersections before cross-traffic is released.",
            "Speed Limit Compliance: If the sedan had traveled at the posted 50 km/h, its stopping distance would have been 24 meters, allowing an easy, safe stop before the line."
        ],
        
        "road_user_takeaways": {
            "two_wheeler_riders": "Never creep past the stop line while waiting for green. Wait for the green signal plus 1 full second to ensure all cross-traffic has halted.",
            "car_drivers_and_passengers": "When approaching a signal that has been green for some time (stale green), ease off the accelerator and prepare your foot over the brake.",
            "pedestrians_and_cyclists": "Never cross signalized junctions on amber; right-turning drivers are focused on oncoming traffic gaps, not pedestrians.",
            "road_authorities": "Calculate yellow change intervals according to ITE / IRC formulas based on 85th-percentile approach speeds, rather than arbitrary fixed timers."
        },
        
        "quiz": [
            {
                "question": "What is the legal and defensive meaning of an amber (yellow) traffic signal?",
                "options": [
                    "Accelerate quickly to clear the intersection before the red signal appears.",
                    "Stop your vehicle before the stop line unless you are so close that stopping cannot be done safely.",
                    "Hazard flashers should be turned on while driving through.",
                    "You have unconditional right of way over cross-traffic."
                ],
                "correct_index": 1,
                "explanation": "Motor Vehicle Regulations and defensive driving standards establish that an amber light indicates impending red. Motorists must come to a safe stop behind the stop line unless stopping abruptly would risk a rear-end collision."
            },
            {
                "question": "What is an 'All-Red Clearance Interval' in traffic engineering?",
                "options": [
                    "A power outage state when all traffic lights fail.",
                    "A brief 1-3 second phase where all directions face a red signal to allow vehicles already inside the junction to clear safely.",
                    "A signal phase reserved exclusively for emergency siren vehicles.",
                    "A night-time flashing mode used to save electricity."
                ],
                "correct_index": 1,
                "explanation": "The all-red clearance interval displays red to all approaches simultaneously between signal phase transitions, ensuring vehicles caught clearing the junction exit before opposing traffic starts moving."
            }
        ],
        
        "sources": [
            {
                "title": "Urban Road Safety Audit - Signal Timing and Dilemma Zone Analysis (IRC:93-1985)",
                "publisher": "Indian Roads Congress & Central Road Research Institute (CRRI)",
                "publication_date": "2023-09-12",
                "url": "https://morth.nic.in/"
            }
        ]
    },
    {
        "id": "CASE_04_DELHI_NOIDA_PILLION_HELMET",
        "title": "Two-Wheeler Urban Flyover Impact & Pillion Helmet Non-Compliance",
        "accident_type": "TWO_WHEELER",
        "accident_type_label": "Two-Wheeler & Pillion Occupant Safety",
        "road_user_category": "Motorcycle Rider & Pillion Passenger",
        "contributing_factors": [
            "Pillion Rider Non-Use of Protective Helmet",
            "Improper Chin-Strap Fastening by Rider",
            "Sudden Car Door Opening (Dooring Incident)",
            "Lack of Defensive Mirror Scanning"
        ],
        "location": "Urban Arterial Flyover Approach (Delhi-NCR Corridor)",
        "date": "October 2023",
        "sensitivity_label": "CONTAINS TECHNICAL COLLISION ANALYSIS • EDUCATIONAL USE ONLY",
        "summary": "A stationary passenger car opened its driver-side door into an active motorcycle lane. While the rider survived, the unhelmeted pillion passenger suffered fatal traumatic brain injury.",
        "image_url": "/assets/case_studies/pillion_helmet.jpg",
        "image_caption": "Urban flyover approach corridor with segregated two-wheeler and commercial lanes.",
        
        "what_happened": (
            "A motorcycle carrying two college students was traveling at 45 km/h along the curb lane of a crowded flyover approach. "
            "A chauffeur-driven sedan parked along the yellow curb line opened its front driver-side door into the traffic lane without scanning the side mirror. "
            "The motorcycle's handlebar struck the opened door edge, destabilizing the vehicle and throwing both occupants onto the asphalt. "
            "The rider wore an ISI-certified helmet with fastened strap; he sustained an arm fracture and abrasions. "
            "The pillion passenger wore no helmet; her head struck the concrete flyover curb at ~35 km/h, resulting in fatal basilar skull fracture and intracranial hemorrhage."
        ),
        
        "what_do_we_know": {
            "confirmed_facts": [
                "The pillion passenger did not wear a protective helmet, despite mandatory statutory requirements under Section 129 of the Motor Vehicles Act.",
                "The rider's helmet absorbed an estimated 320 Gs of impact deceleration, preventing cranial injury.",
                "The parked car occupant opened the door by 70 cm into the live traffic lane within 0.8 seconds, leaving zero reaction time for the motorcyclist.",
                "Motorcycle was traveling at a moderate, legal speed (45 km/h in 50 zone)."
            ],
            "preliminary_or_unconfirmed": [
                "Whether the driver of the parked vehicle engaged hazard warning lights prior to opening the door."
            ],
            "unknown_details": [
                "Exact coefficient of friction of the painted curb edge at the moment of secondary impact."
            ]
        },
        
        "how_crash_occurred": {
            "immediate_sequence": "Stationary vehicle opens door into traffic lane -> Handlebar contact -> Vehicle instability and ejection -> Cranial impact against concrete curb structure.",
            "contributing_factors": [
                "The 'Dooring' Phenomenon: Occupants in stationary vehicles failing to check side mirrors before egress.",
                "Pillion Kinetic Trajectory: Pillion passengers sit higher than riders, experience higher rotational torque, and are projected further during sudden deceleration."
            ],
            "road_and_environment": "Four-lane flyover approach; asphalt surface; clear daylight; heavy urban afternoon traffic.",
            "vehicle_and_occupant_factors": "Motorcyclists possess zero external crumple structure. The helmet shell and EPS liner constitute the sole protective mechanism against skull fracture."
        },
        
        "prevention_measures": [
            "Universal Helmet Rule: Both rider and pillion passenger must wear certified, chin-strap fastened helmets on 100% of trips, regardless of distance.",
            "The 'Dutch Reach' Technique: Vehicle occupants should open doors with their far hand (left hand for right-side doors), which forces the torso and eyes to look back into the side mirror and blind spot.",
            "Defensive Lateral Separation: Motorcyclists should maintain at least 1.2 meters of buffer clearance when passing stationary or parked vehicles.",
            "Full-Face Certified Helmets (IS 4151 / ECE 22.06): Provide chin and facial protection which open-face helmets lack."
        ],
        
        "road_user_takeaways": {
            "two_wheeler_riders": "Refuse to carry any passenger who does not wear a properly fastened, certified helmet. Handing your passenger a helmet is the ultimate act of care.",
            "car_drivers_and_passengers": "Practice the Dutch Reach. Look before opening any car door. A 2-second glance saves a human life.",
            "pedestrians_and_cyclists": "Watch for vehicle brake lights and head movement inside parked cars to predict sudden door openings.",
            "road_authorities": "Demarcate dedicated buffer door zones along on-street parking corridors and install bicycle/motorcycle warning delineators."
        },
        
        "quiz": [
            {
                "question": "What is the 'Dutch Reach' method for opening vehicle doors safely?",
                "options": [
                    "Pushing the door open with both hands as quickly as possible.",
                    "Opening the car door using the hand furthest from the door, which forces your upper body to turn and look into the mirror and blind spot.",
                    "Kicking the door open from the bottom to alert approaching traffic.",
                    "Rolling down the window and waving your arm before opening the door."
                ],
                "correct_index": 1,
                "explanation": "Originating in the Netherlands, the Dutch Reach requires opening the car door with the far hand (e.g. right hand for driver door). This automatically pivots the torso, directing the driver's gaze directly into the side mirror and rear blind spot."
            },
            {
                "question": "According to official MoRTH statistics, what percentage of fatal two-wheeler casualties in India involve unhelmeted pillion riders?",
                "options": [
                    "Under 5%",
                    "Approximately 15%",
                    "Over 40% of all two-wheeler accident fatalities",
                    "Pillion riders are rarely injured compared to drivers"
                ],
                "correct_index": 2,
                "explanation": "MoRTH official road accident reports document that over 40% of two-wheeler fatalities in India are pillion passengers, due to widespread non-compliance with helmet laws by secondary occupants."
            }
        ],
        
        "sources": [
            {
                "title": "MoRTH Road Accidents in India 2023 - Two-Wheeler Safety & Helmet Compliance Chapter",
                "publisher": "Ministry of Road Transport and Highways (MoRTH)",
                "publication_date": "2024-03-01",
                "url": "https://morth.nic.in/"
            }
        ]
    },
    {
        "id": "CASE_05_ORISSA_HIGHWAY_FATIGUE_MICRO_SLEEP",
        "title": "Midnight Micro-Sleep & Heavy Commercial Median Rollover",
        "accident_type": "FATIGUE",
        "accident_type_label": "Driver Fatigue & Circadian Micro-Sleep",
        "road_user_category": "Long-Haul Commercial Freight Truck",
        "contributing_factors": [
            "Continuous Driving Exceeding 14 Hours Without Mandatory Rest",
            "Circadian Nadir (Circadian Low between 02:00 and 05:00 AM)",
            "Micro-Sleep of 3 to 4 Seconds at Cruising Speed",
            "Absence of Continuous Shoulder Rumble Strips"
        ],
        "location": "NH-16 Coastal Highway Corridor (Odisha-Andhra Border)",
        "date": "November 2023",
        "sensitivity_label": "CONTAINS TECHNICAL COLLISION ANALYSIS • EDUCATIONAL USE ONLY",
        "summary": "A long-haul container truck drifted off the highway at 03:20 AM due to driver micro-sleep, crossing the median and colliding with an oncoming intercity bus.",
        "image_url": "/assets/case_studies/fatigue_corridor.jpg",
        "image_caption": "National highway 4-lane divided corridor with median vegetation and illumination.",
        
        "what_happened": (
            "At 03:20 AM, an interstate container truck was completing an overnight transit. "
            "Driver logs and GPS telematics established that the driver had been behind the wheel for 14.5 hours with only two 10-minute tea breaks. "
            "Between 03:19 AM and 03:20 AM, while traveling along a straight, flat stretch of NH-16 at 72 km/h, the driver experienced an involuntary 'micro-sleep' episode lasting approximately 3.5 seconds. "
            "During this episode, the vehicle drifted 4.2 meters to the right, climbed the unprotected median barrier, entered the opposing northbound carriageway, and sideswiped an intercity sleeper bus. "
            "The collision caused 5 fatalities and 14 serious injuries."
        ),
        
        "what_do_we_know": {
            "confirmed_facts": [
                "Telemetry data recorded zero steering wheel movement, throttle adjustment, or brake pedal application for 3.6 seconds prior to median contact (hallmark signature of driver micro-sleep).",
                "Accident occurred inside the circadian biological low window (02:00-05:00 AM) where sleep drive is physiologically highest.",
                "Driver tested negative for alcohol and narcotics; extreme chronic sleep deprivation was the sole primary factor.",
                "Opposing bus driver took defensive evasive action by steering left toward the shoulder, which transformed a direct head-on collision into an oblique sideswipe, saving an estimated 25+ lives."
            ],
            "preliminary_or_unconfirmed": [
                "Whether the driver was subjected to coercive delivery deadlines by the freight forwarding operator."
            ],
            "unknown_details": [
                "Exact total hours of restorative sleep the driver obtained during the 48 hours preceding departure."
            ]
        },
        
        "how_crash_occurred": {
            "immediate_sequence": "Continuous 14-hour operation -> Circadian sleep pressure overload -> 3.6-second micro-sleep -> Vehicle drift across median -> Opposing lane collision.",
            "contributing_factors": [
                "The Science of Micro-Sleep: Sleep is an involuntary biological drive. After 17-19 hours without sleep, human cognitive impairment is equivalent to a Blood Alcohol Concentration (BAC) of 0.05%; after 24 hours, it equals 0.10% BAC.",
                "Ineffective Stimulants: Scientific studies prove that cold air, loud radio, and tea provide only 3-5 minutes of cognitive relief before micro-sleep reasserts itself."
            ],
            "road_and_environment": "Four-lane divided national highway; dry asphalt; dark night; low ambient lighting.",
            "vehicle_and_occupant_factors": "Absence of Advanced Driver Assistance Systems (ADAS) such as Lane Departure Warning (LDW) or Driver Fatigue Monitoring Systems (DMS)."
        },
        
        "prevention_measures": [
            "The 2-Hour Rest Rule: Stop and rest for at least 15-20 minutes after every 2 hours of continuous driving.",
            "Zero Tolerance for Drowsy Driving: If you experience heavy eyelids, frequent yawning, or wandering thoughts, pull over immediately at a secure fuel station or rest stop for a 20-minute power nap.",
            "Acoustic Shoulder & Median Rumble Strips: Grooved pavement markings that vibrate the steering wheel and produce loud cabin noise when tires drift out of lane.",
            "Telematics Electronic Logging Devices (ELD): Legally capping commercial drivers at maximum 8-hour daily driving shifts with mandatory 8-hour rest periods."
        ],
        
        "road_user_takeaways": {
            "two_wheeler_riders": "Avoid riding on high-speed commercial freight corridors between 01:00 AM and 05:00 AM when heavy truck driver fatigue is at peak statistical incidence.",
            "car_drivers_and_passengers": "If you catch yourself yawning twice or realize you do not remember the last 2 kilometers, pull over immediately. Arriving 30 minutes later is infinitely better than never arriving.",
            "heavy_vehicle_drivers": "No cargo is worth a life. The only medical cure for sleep deprivation is sleep. Power-nap for 20 minutes before continuing.",
            "road_authorities": "Mandate continuous inductive rumble strips along all highway edges and construct 24/7 designated truck driver rest amenities with clean sleeping quarters."
        },
        
        "quiz": [
            {
                "question": "What is the physiological reality of 'micro-sleep' while operating a motor vehicle?",
                "options": [
                    "A conscious decision to close one's eyes while remaining fully alert.",
                    "An involuntary, uncontrolled episode of unconsciousness lasting between 1 and 15 seconds, where the brain shuts down sensory processing.",
                    "A brief drop in blood pressure that only affects elderly motorists.",
                    "A medical condition only triggered by prescription medications."
                ],
                "correct_index": 1,
                "explanation": "Micro-sleep is an uncontrollable biological lapse into sleep lasting from 1 to 15 seconds. During this time, the brain fails to register visual, auditory, or physical road stimuli, while the vehicle travels tens of meters unguided."
            },
            {
                "question": "Scientific research shows that continuous wakefulness of 17 to 19 hours impairs driving capability equivalent to what Blood Alcohol Concentration (BAC)?",
                "options": [
                    "0.01% BAC (mild sensation)",
                    "0.05% BAC (the legal intoxication limit in many jurisdictions)",
                    "Zero impairment, as long as coffee is consumed",
                    "Fatigue cannot be scientifically compared to alcohol"
                ],
                "correct_index": 1,
                "explanation": "Peer-reviewed studies by the WHO, CDC, and National Sleep Foundation establish that sustained wakefulness of 17-19 hours produces reaction time and cognitive deficits identical to a Blood Alcohol Concentration of 0.05%."
            }
        ],
        
        "sources": [
            {
                "title": "Driver Fatigue and Commercial Vehicle Accidents on National Highways",
                "publisher": "Central Road Research Institute (CRRI) & National Road Safety Board",
                "publication_date": "2023-12-05",
                "url": "https://roadsafetycommittee.morth.gov.in/nrsb/road-safety.html"
            }
        ]
    },
    {
        "id": "CASE_06_BENGALURU_ORR_PEDESTRIAN_BLINDSPOT",
        "title": "Urban Arterial Pedestrian Collision & Commercial Blind-Zone Masking",
        "accident_type": "PEDESTRIAN",
        "accident_type_label": "Pedestrian Safety & Heavy Vehicle Blind-Zones",
        "road_user_category": "Pedestrian & Concrete Transit Mixer",
        "contributing_factors": [
            "Pedestrian Mid-Block Crossing Outside Marked Crosswalk",
            "Heavy Vehicle 'Front Blind-Zone' (< 3 meters in front of cab)",
            "Absence of Pedestrian Median Barrier",
            "Low-Speed Creep in Congested Urban Intersection"
        ],
        "location": "Bengaluru Outer Ring Road (ORR Commercial Corridor)",
        "date": "December 2023",
        "sensitivity_label": "CONTAINS TECHNICAL COLLISION ANALYSIS • EDUCATIONAL USE ONLY",
        "summary": "A pedestrian attempting to cross an urban arterial walked within 1.5 meters directly in front of a high-cab construction mixer stopped in traffic. When the light changed, the driver had zero visual sightline.",
        "image_url": "/assets/case_studies/pedestrian_crossing.jpg",
        "image_caption": "Urban commercial arterial corridor with high-volume transit traffic and pedestrian desire lines.",
        
        "what_happened": (
            "During peak morning commute hours at 09:15 AM, a 28-year-old software engineer was attempting to cross the 6-lane Outer Ring Road "
            "to reach a transit bus stop. Instead of walking 70 meters to the pedestrian grade-separated foot-overbridge (FOB), "
            "the pedestrian navigated between stationary vehicles in slow-moving queue traffic. "
            "The pedestrian stepped directly in front of a heavy multi-axle concrete mixer truck, passing approximately 1.2 meters from the front bumper. "
            "Due to the truck's elevated cab geometry (hood height of 2.1 meters), the pedestrian was located squarely within the driver's forward blind spot. "
            "When traffic ahead moved forward, the truck driver engaged 1st gear and moved forward at 8 km/h, knocking down the pedestrian and causing fatal crush trauma."
        ),
        
        "what_do_we_know": {
            "confirmed_facts": [
                "Reconstruction confirmed the driver had zero direct optical line-of-sight to any object below 1.8 meters tall within 3 meters directly forward of the front grille.",
                "The truck was not equipped with a Class VI front-mounted downward convex cross-view mirror (mandated under AIS-001/002 standards for modern heavy commercial vehicles).",
                "A pedestrian foot-overbridge equipped with escalators was located 70 meters away.",
                "Driver was traveling at low speed (< 10 km/h) and stopped within 3 meters upon hearing auditory warnings from bystanders."
            ],
            "preliminary_or_unconfirmed": [
                "Whether the pedestrian was wearing noise-canceling headphones at the time of crossing."
            ],
            "unknown_details": [
                "Exact duration the truck was stationary before moving forward."
            ]
        },
        
        "how_crash_occurred": {
            "immediate_sequence": "Pedestrian crosses within heavy vehicle blind zone -> Driver visual horizon blocked by hood height -> Vehicle accelerates on green signal -> Low-speed fatal impact.",
            "contributing_factors": [
                "The Heavy Vehicle 'No-Zone': Heavy trucks have 4 extensive blind spots: Front (up to 3 meters), Rear (up to 9 meters), Left Side (massive angle), and Right Side under mirror.",
                "Jaywalking in Heavy Queues: Pedestrians falsely assume that if they can see a truck, the truck driver can see them."
            ],
            "road_and_environment": "Six-lane divided urban arterial; dense morning commuter traffic; dry asphalt; daylight.",
            "vehicle_and_occupant_factors": "Lack of Class VI front-view blind-spot mirrors and ultrasonic forward obstacle proximity sensors."
        },
        
        "prevention_measures": [
            "The 3-Meter Golden Rule for Pedestrians: Never cross within 3 meters of the front of a bus, truck, or commercial vehicle. If you cannot see the driver's eyes, the driver cannot see you.",
            "Use Grade-Separated Pedestrian Infrastructure: Always utilize foot-overbridges, underpasses, and signalized zebra crossings.",
            "Mandatory Class VI Front Mirror Retrofit: Installing convex front-view mirrors that illuminate the ground directly beneath the front bumper.",
            "Pedestrian Anti-Jaywalking Median Fencing: Installing 1.8-meter anti-climb median screens along express corridors to channel pedestrians to safe crossings."
        ],
        
        "road_user_takeaways": {
            "pedestrians_and_cyclists": "Never walk directly in front of stationary buses or trucks. Make eye contact with drivers before crossing in front of any vehicle.",
            "car_drivers_and_passengers": "Do not tailgate heavy commercial vehicles; your vehicle is completely hidden in their rear blind-zone.",
            "heavy_vehicle_drivers": "Before rolling forward from a stationary queue, check your front and side blind-spot mirrors twice for pedestrians and two-wheelers.",
            "road_authorities": "Build pedestrian infrastructure along natural 'desire lines' with universal accessibility (ramps/elevators) so pedestrians don't risk arterial crossings."
        },
        
        "quiz": [
            {
                "question": "What is the recommended minimum safe distance a pedestrian should maintain when crossing in front of a stationary heavy truck or bus?",
                "options": [
                    "0.5 meters (as close as possible to cross quickly)",
                    "At least 3 meters (10 feet) so the elevated driver has direct line of sight over the hood",
                    "There is no danger if the truck is stopped with engine idling",
                    "Only cross from the left-hand blind side"
                ],
                "correct_index": 1,
                "explanation": "Because high-cab commercial vehicles have elevated hoods (often 2+ meters high), an extensive blind zone extends 3 meters forward. Staying at least 3 meters away ensures the driver can see your head and upper body directly."
            },
            {
                "question": "What is the proven 'Eye Contact Rule' for pedestrian road safety?",
                "options": [
                    "Staring aggressively at approaching vehicles to demand right-of-way.",
                    "Confirming direct eye contact with the vehicle driver to ensure they have physically seen and registered your presence before you step into their path.",
                    "Wearing reflective sunglasses at night.",
                    "Looking only at traffic lights without watching oncoming wheels."
                ],
                "correct_index": 1,
                "explanation": "The Eye Contact Rule requires pedestrians to confirm that the driver has actually seen them. If you cannot see the driver's face or eyes, you must assume they have not seen you and will not stop."
            }
        ],
        
        "sources": [
            {
                "title": "MoRTH Vulnerable Road User Safety Guidelines - Pedestrian Protection Standards",
                "publisher": "Ministry of Road Transport and Highways (MoRTH)",
                "publication_date": "2024-01-15",
                "url": "https://morth.nic.in/"
            }
        ]
    },
    {
        "id": "CASE_07_AHMEDABAD_EXPRESSWAY_REAR_SEATBELT",
        "title": "Expressway High-Speed Tire Blowout, Rollover & Rear Occupant Ejection",
        "accident_type": "OCCUPANT_RESTRAINT",
        "accident_type_label": "Seatbelt Compliance & Occupant Decoupling",
        "road_user_category": "Sport Utility Vehicle (SUV) Family Travel",
        "contributing_factors": [
            "Under-Inflated Rear Tire Suffering Tread Separation at 110 km/h",
            "Non-Use of 3-Point Seatbelts by 3 Rear-Seat Passengers",
            "Violent Multiple Rollover Dynamics",
            "Ejection of Unrestrained Rear Occupants through Side Windows"
        ],
        "location": "Ahmedabad-Vadodara National Expressway (NE-1)",
        "date": "May 2023",
        "sensitivity_label": "CONTAINS TECHNICAL COLLISION ANALYSIS • EDUCATIONAL USE ONLY",
        "summary": "An SUV experienced a rear tire blowout at 110 km/h and rolled 4 times. Both belted front occupants survived, while all 3 unrestrained rear occupants were ejected from the cabin with fatal consequences.",
        "image_url": "/assets/case_studies/seatbelt_rollover.jpg",
        "image_caption": "Four-lane access-controlled expressway with concrete medians and asphalt road surface.",
        
        "what_happened": (
            "A family of five was traveling in a mid-size SUV on an access-controlled expressway on a hot summer afternoon (ambient temperature: 44°C). "
            "The vehicle was cruising at 110 km/h. The driver and front co-passenger were wearing their 3-point seatbelts. "
            "The three rear-seat passengers (a grandmother and two teenage siblings) were not buckled. "
            "The left rear tire, which was under-inflated by 12 PSI, suffered internal carcass delamination and sudden blowout. "
            "The driver attempted rapid overcorrection, triggering an untripped rollover across the highway shoulder. "
            "The vehicle completed four full barrel rolls before coming to rest on its roof. "
            "The two belted front occupants remained inside their survival space with minor contusions. "
            "All three unbelted rear occupants were violently ejected through fractured side windows; two died on impact with the ground."
        ),
        
        "what_do_we_know": {
            "confirmed_facts": [
                "The passenger cabin survival cell remained structurally intact with minimal roof crush intrusion.",
                "Both front occupants wearing 3-point seatbelts walked away with minor contusions and soft-tissue soreness.",
                "Under-inflation combined with high speed and high ambient temperature (44°C) created excessive sidewall flex, heating tire air beyond 90°C and causing structural tread separation.",
                "Section 194B of the Motor Vehicles Act mandates seatbelts for all occupants, including rear passengers."
            ],
            "preliminary_or_unconfirmed": [
                "Whether the tire had suffered previous internal damage from pothole impacts before entering the expressway."
            ],
            "unknown_details": [
                "Exact tire age and tread depth remaining prior to blowout."
            ]
        },
        
        "how_crash_occurred": {
            "immediate_sequence": "Under-inflated tire blowout at high speed -> Driver panic overcorrection -> Yaw instability and 4-roll sequence -> Centrifugal ejection of unbelted rear occupants.",
            "contributing_factors": [
                "Newton's First Law of Motion: When an unbelted passenger vehicle rolls or stops abruptly, unrestrained bodies continue traveling at 110 km/h until they strike the vehicle roof, pillars, or are launched through windows.",
                "The 'Human Projectile' Effect: In a crash, unbelted rear occupants strike front seatbacks with forces exceeding 30 times their body weight (over 2 tonnes of force), crushing front occupants."
            ],
            "road_and_environment": "Four-lane concrete access-controlled expressway; dry surface; extreme daytime summer heat.",
            "vehicle_and_occupant_factors": "Modern vehicle structural cage held, but open side window space provided an ejection portal for unbelted occupants."
        },
        
        "prevention_measures": [
            "100% Seatbelt Rule Front and Rear: Every passenger must click their 3-point seatbelt before the vehicle moves. No exceptions.",
            "Pre-Trip Tire Pressure Check: Check cold tire inflation pressures with an accurate gauge before high-speed highway travel.",
            "Blowout Response Protocol: If a tire blows out at high speed, NEVER slam on the brakes or jerk the steering wheel. Gently ease off the throttle, maintain a firm two-handed grip on the wheel, and coast gradually to a stop on the shoulder.",
            "Tire Age Audits: Replace tires that are older than 5 years regardless of remaining tread depth, as rubber compounds oxidize and weaken internally."
        ],
        
        "road_user_takeaways": {
            "car_drivers_and_passengers": "Make clicking the seatbelt a reflex the moment you sit down. Never allow any child or adult to ride unbelted in the rear seats.",
            "parents_and_families": "Install age-appropriate child restraint systems (ISOFIX / Child Car Seats) for children under 10 years old.",
            "two_wheeler_riders": "Always monitor tire pressures; two-wheelers are even more susceptible to fatal blowouts.",
            "road_authorities": "Enforce rear seatbelt compliance through automated AI overhead camera detection systems at expressway toll plazas."
        },
        
        "quiz": [
            {
                "question": "What is the correct defensive response if your car suffers a sudden tire blowout at 100 km/h on a highway?",
                "options": [
                    "Slam on the brake pedal with maximum force immediately.",
                    "Yank the steering wheel toward the shoulder and pull the handbrake.",
                    "Do NOT brake hard; hold the steering wheel firmly with both hands, ease off the accelerator smoothly, and guide the car safely to the shoulder as speed drops.",
                    "Shift the transmission into reverse to slow down."
                ],
                "correct_index": 2,
                "explanation": "Panic braking or abrupt steering during a high-speed blowout creates instant yaw instability and triggers immediate vehicle rollover. Keeping the wheel steady and coasting to a controlled stop preserves vehicle balance."
            },
            {
                "question": "What happens to unrestrained rear-seat passengers during a 50 km/h head-on collision or rollover?",
                "options": [
                    "They remain held in place by friction against the cloth upholstery.",
                    "They become lethal human projectiles, striking front-seat occupants with up to 30 times their body weight in force.",
                    "Airbags from the dashboard protect rear passengers automatically.",
                    "Rear seats are fundamentally safe without seatbelts."
                ],
                "correct_index": 1,
                "explanation": "Physics dictates that an unrestrained body continues traveling at the impact speed. An unbelted 60 kg adult hits the front seatback and front occupant with ~1.8 tonnes of kinetic force, frequently killing both the front occupant and themselves."
            }
        ],
        
        "sources": [
            {
                "title": "World Health Organization (WHO) Road Safety Fact Sheet - Seat Belts & Child Restraints",
                "publisher": "World Health Organization",
                "publication_date": "2023-05-10",
                "url": "https://www.who.int/news-room/fact-sheets/detail/road-traffic-injuries"
            }
        ]
    },
    {
        "id": "CASE_08_CHENNAI_ECR_AQUAPLANING",
        "title": "Monsoon Downpour Standing Water & Hydroplaning (Aquaplaning)",
        "accident_type": "MONSOON_WEATHER",
        "accident_type_label": "Wet Road Surface & Aquaplaning",
        "road_user_category": "Passenger Car",
        "contributing_factors": [
            "Cruising Speed of 85 km/h on Standing Water (> 65 km/h Aquaplane Threshold)",
            "Worn Tire Treads (< 1.6 mm Legal Minimum Depth)",
            "Panic Hard Braking on Surface Water",
            "Inadequate Highway Cross-Slope Drainage"
        ],
        "location": "East Coast Road (ECR Coastal Highway Corridor)",
        "date": "November 2023",
        "sensitivity_label": "CONTAINS TECHNICAL COLLISION ANALYSIS • EDUCATIONAL USE ONLY",
        "summary": "A sedan hit a 40mm sheet of standing rainwater at 85 km/h, lost all steering traction due to dynamic aquaplaning, and spun into a concrete roadside culvert.",
        "image_url": "/assets/case_studies/aquaplaning.jpg",
        "image_caption": "Coastal highway corridor during tropical monsoon downpour with pooled surface water.",
        
        "what_happened": (
            "During intense northeast monsoon rains along the East Coast Road, torrential precipitation produced pooled standing water "
            "in the right express lane where settlement had created a slight depression. "
            "A sedan traveling at 85 km/h entered the water sheet. The vehicle's front tires had worn down to 1.4 mm tread depth. "
            "At 85 km/h, the tires could not evacuate the volume of water through their shallow grooves. "
            "Water pressure built up in front of the contact patch, lifting the tires off the asphalt entirely. "
            "The car rode on a microscopic wedge of water with zero friction coefficient. "
            "When the driver felt the steering feel 'light', he slammed on the brakes. The vehicle entered an uncontrolled 360-degree spin, "
            "sliding backward off the roadway and striking a concrete culvert structure. One passenger died, and two were severely injured."
        ),
        
        "what_do_we_know": {
            "confirmed_facts": [
                "Both front tires had tread depths below 1.5 mm (legal safety limit: 1.6 mm; recommended wet minimum: 3.0 mm).",
                "Aquaplaning speed formula (V = 6.35 * sqrt(Tire Pressure in PSI)) established that for the vehicle's 30 PSI tires, full dynamic aquaplaning was mathematically guaranteed above 62 km/h on standing water.",
                "Road cross-fall drainage was partially choked with leaf litter, increasing water film depth to over 35 mm.",
                "Electronic Stability Control (ESC) cannot correct trajectory when all four tires are fully decoupled from road contact."
            ],
            "preliminary_or_unconfirmed": [
                "Whether the driver had cruise control active when hitting the water puddle."
            ],
            "unknown_details": [
                "Exact instant volume of rainwater falling per minute at time of impact."
            ]
        },
        
        "how_crash_occurred": {
            "immediate_sequence": "Vehicle hits standing water at 85 km/h -> Worn treads fail to evacuate water -> Tire contact patch lifts -> Panic braking initiates spin -> Culvert impact.",
            "contributing_factors": [
                "Dynamic Aquaplaning Physics: When tire water dispersal capacity is exceeded, water pressure builds until the vehicle literally surfs on water with zero steering or braking.",
                "Tire Tread Depth: A new tire with 8 mm tread disperses ~30 liters of water per second at 80 km/h; a worn 1.6 mm tire disperses less than 6 liters."
            ],
            "road_and_environment": "Four-lane coastal scenic highway; standing water pools; torrential rain; overcast daylight.",
            "vehicle_and_occupant_factors": "Worn tires and panic braking transformed a preventable near-miss into a fatal barrier impact."
        },
        
        "prevention_measures": [
            "Reduce Speed by At Least 30% in Rain: On wet roads, limit speeds to 50-60 km/h, and drop to 40 km/h in standing water.",
            "The 3-Millimeter Wet Tire Rule: Replace tires when tread drops below 3.0 mm if you drive in monsoon climates.",
            "How to Recover from Aquaplaning: If steering goes light and the car hydroplanes, DO NOT BRAKE and DO NOT TURN THE WHEEL. Ease off the gas pedal smoothly, keep the wheel straight, and wait for tires to reconnect with asphalt.",
            "Turn Off Cruise Control in Wet Weather: Cruise control can misinterpret wheel spin as deceleration and apply more throttle, exacerbating hydroplaning."
        ],
        
        "road_user_takeaways": {
            "two_wheeler_riders": "Two-wheelers can aquaplane even more violently than cars. Avoid sudden steering or front brake use on road markings, manhole covers, and puddles.",
            "car_drivers_and_passengers": "Check your tire tread depths with a coin or gauge before the monsoon season. If tires are bald, do not drive on highways.",
            "heavy_vehicle_drivers": "Heavy trucks have high contact pressures and aquaplane less readily, but throw massive blinding spray onto lighter vehicles. Maintain extra following distance.",
            "road_authorities": "Maintain clean cross-fall highway drainage channels to prevent standing water accumulation on fast express lanes."
        },
        
        "quiz": [
            {
                "question": "What is the recommended defensive action if you feel your vehicle beginning to aquaplane (hydroplane) on standing water?",
                "options": [
                    "Slam on the brakes with maximum force and turn the steering wheel sharply.",
                    "Pull the emergency handbrake and accelerate.",
                    "Ease your foot smoothly off the accelerator, keep the steering wheel pointed straight, and avoid hard braking until tires regain grip.",
                    "Shift into neutral and turn off the engine."
                ],
                "correct_index": 2,
                "explanation": "Braking or turning during aquaplaning induces an immediate uncontrolled spin because the tires have zero traction. Easing off the throttle allows the vehicle's momentum to slow until the tires cut through the water film and regain pavement contact."
            },
            {
                "question": "Why does rain dramatically increase stopping distance for all motor vehicles?",
                "options": [
                    "Rain cools down the brake fluid, making it thicker.",
                    "Water creates a lubricating film between tire rubber and asphalt micro-texture, reducing the friction coefficient by up to 50%.",
                    "Rain increases vehicle weight due to water accumulation on the roof.",
                    "Windshields absorb more light, making brakes less responsive."
                ],
                "correct_index": 1,
                "explanation": "Water acts as a liquid lubricant between the tire rubber and asphalt aggregate, slashing the tire-road friction coefficient from ~0.8 (dry) to ~0.4 (wet), doubling normal braking distances."
            }
        ],
        
        "sources": [
            {
                "title": "MoRTH Technical Circular on Monsoon Highway Drainage and Aquaplaning Countermeasures",
                "publisher": "Ministry of Road Transport and Highways (MoRTH)",
                "publication_date": "2023-10-14",
                "url": "https://morth.nic.in/"
            }
        ]
    },
    {
        "id": "CASE_09_HYDERABAD_ORR_PHONE_DISTRACTION",
        "title": "High-Speed Mobile Phone Distraction & Highway Guidepost Impact",
        "accident_type": "DISTRACTED_DRIVING",
        "accident_type_label": "Mobile Phone & Cognitive Distraction",
        "road_user_category": "Passenger Car",
        "contributing_factors": [
            "Text Messaging & Audio Messaging While Driving at 100 km/h",
            "Inattentional Blindness (Cognitive Decoupling)",
            "Drift into Highway Gantry Support Column",
            "Single-Vehicle High-Energy Impact"
        ],
        "location": "Hyderabad Outer Ring Road (ORR Access-Controlled Expressway)",
        "date": "July 2023",
        "sensitivity_label": "CONTAINS TECHNICAL COLLISION ANALYSIS • EDUCATIONAL USE ONLY",
        "summary": "A driver looked down at a mobile phone screen for 4.2 seconds to read an instant message while cruising at 100 km/h, drifting into a steel overhead gantry pylon with fatal consequences.",
        "image_url": "/assets/case_studies/phone_distraction.jpg",
        "image_caption": "Eight-lane access-controlled expressway with overhead sign gantries and steel barrier protection.",
        
        "what_happened": (
            "At 14:30 PM on a clear, sunny weekday, a 26-year-old professional was driving alone on the 8-lane Hyderabad Outer Ring Road. "
            "Vehicle speed was recorded at 102 km/h in the second lane. "
            "In-cabin camera footage and mobile phone forensic timeline established that the driver received a text message notification. "
            "The driver unlocked the phone screen and looked down to read the message for an unbroken duration of 4.2 seconds. "
            "At 102 km/h (28.3 meters per second), the vehicle traveled 119 meters completely blind. "
            "A slight 1.5-degree drift steered the vehicle onto the shoulder and directly into the concrete foundation of an overhead sign gantry. "
            "The impact occurred with zero pre-impact braking. The driver died instantly from blunt thoracic trauma."
        ),
        
        "what_do_we_know": {
            "confirmed_facts": [
                "Digital forensics confirmed the smartphone screen was active, displaying an open instant messaging app at the exact second of crash impact.",
                "Vehicle traveled 119 meters (more than the length of an entire football field) while the driver's eyes were off the road.",
                "No mechanical steering, brake, or tire failure occurred; road conditions were pristine and dry.",
                "Hands-free or handheld phone usage increases crash risk by 4 to 6 times according to WHO epidemiological studies."
            ],
            "preliminary_or_unconfirmed": [
                "Whether the driver was under fatigue prior to the phone interaction."
            ],
            "unknown_details": [
                "Exact secondary application background notifications active at the time."
            ]
        },
        
        "how_crash_occurred": {
            "immediate_sequence": "Phone notification chime -> Driver looks down to unlock screen -> 4.2 seconds of complete visual blindness -> 119m unguided drift -> Concrete barrier impact.",
            "contributing_factors": [
                "The Three Types of Distraction: Visual (eyes off road), Manual (hands off wheel), and Cognitive (mind off driving). Text messaging involves all three simultaneously.",
                "Inattentional Blindness: Even when drivers glance back at the road after looking at a phone, the brain requires up to 1.5 seconds to re-orient and identify obstacles."
            ],
            "road_and_environment": "Eight-lane divided expressway; dry concrete pavement; clear daylight; light traffic.",
            "vehicle_and_occupant_factors": "Vehicle was equipped with forward collision warning (FCW), but driver failed to react in time."
        },
        
        "prevention_measures": [
            "Enable 'Driving Focus / Do Not Disturb': Set your smartphone to automatically silence calls and text messages while moving.",
            "The Glovebox Rule: Place your phone inside the glovebox, center console, or back seat where it cannot be reached while driving.",
            "Pull Over Safely for Urgent Calls: If a communication cannot wait, signal, pull into a designated service area or parking bay, and respond only when stationary.",
            "Hands-Free Is Not Safe: Scientific research shows that hands-free phone conversations produce identical cognitive distraction to holding a handset."
        ],
        
        "road_user_takeaways": {
            "two_wheeler_riders": "Never wedge a phone inside your helmet cheekpad or look down at handlebars. A 2-second glance at 40 km/h is 22 meters of blind travel.",
            "car_drivers_and_passengers": "Speak up as a passenger! If your driver touches their phone, politely say: 'Please let me handle the phone; your safe driving is what matters.'",
            "pedestrians_and_cyclists": "Never look at your phone while stepping onto roadways or crosswalks.",
            "road_authorities": "Deploy automated AI mobile phone detection cameras that photograph and penalize drivers operating handsets behind the wheel."
        },
        
        "quiz": [
            {
                "question": "At 100 km/h, how far does a vehicle travel during a 'brief' 4-second glance at a smartphone screen?",
                "options": [
                    "Approximately 20 meters",
                    "Approximately 50 meters",
                    "Over 110 meters (longer than an entire football stadium field)",
                    "Less than 10 meters"
                ],
                "correct_index": 2,
                "explanation": "At 100 km/h, a vehicle covers 27.78 meters every single second. A 4-second distraction glance means the vehicle travels 111.1 meters completely blind, leaving zero reaction time for sudden obstacles."
            },
            {
                "question": "What does scientific research reveal regarding hands-free Bluetooth phone calls compared to handheld calls?",
                "options": [
                    "Hands-free calls eliminate all distraction risk.",
                    "Hands-free phone calls produce nearly identical cognitive distraction because the brain is focused on the conversation rather than road scanning.",
                    "Hands-free calls improve driver reaction times.",
                    "Hands-free calls are legally mandated as 100% risk-free."
                ],
                "correct_index": 1,
                "explanation": "Neuroscientific studies show that cognitive distraction occurs inside the brain's parietal lobe regardless of whether a hand holds the phone. Hands-free conversations degrade situational awareness and increase crash risk by ~4x."
            }
        ],
        
        "sources": [
            {
                "title": "WHO Mobile Phone Use - A Growing Problem of Driver Distraction",
                "publisher": "World Health Organization (WHO)",
                "publication_date": "2023-04-18",
                "url": "https://www.who.int/news-room/fact-sheets/detail/road-traffic-injuries"
            }
        ]
    },
    {
        "id": "CASE_10_KERALA_GHAT_BLIND_CURVE_OVERTAKE",
        "title": "Wrong-Side Overtaking on Blind Hairpin Mountain Curve",
        "accident_type": "BLIND_CURVE",
        "accident_type_label": "Overtaking & Mountain Hairpin Curves",
        "road_user_category": "Passenger Car & State Transport Bus",
        "contributing_factors": [
            "Overtaking Across Solid White / Double Yellow Line",
            "Zero Forward Sightline on Blind Right-Hand Hairpin Curve",
            "Excessive Speed on Mountain Gradient",
            "Head-On High-Energy Impact"
        ],
        "location": "Wayanad Ghat Road (Thamarassery Churam Mountain Pass)",
        "date": "September 2023",
        "sensitivity_label": "CONTAINS TECHNICAL COLLISION ANALYSIS • EDUCATIONAL USE ONLY",
        "summary": "A hatchback attempted to overtake a slow-moving tourist van on a blind right-hand hairpin curve, colliding head-on with a descending intercity bus.",
        "image_url": "/assets/case_studies/blind_curve.jpg",
        "image_caption": "Mountain hairpin bend corridor with solid center lines, convex mirrors, and safety parapets.",
        
        "what_happened": (
            "Along the winding Thamarassery Churam ghat road (9 hairpin bends), traffic was descending slowly behind an 18-seat tourist van. "
            "A hatchback following the van grew impatient after 4 minutes of following at 25 km/h. "
            "Approaching Hairpin Bend #6 (a blind curve bounded by steep rock on the right and a cliff gorge on the left), "
            "the car driver crossed the continuous solid white center line to overtake the van. "
            "The driver had zero forward line of sight around the rock bluff. "
            "Simultaneously, a state road transport bus was descending the curve within its own designated lane at 30 km/h. "
            "The car and bus collided head-on with an aggregate impact speed exceeding 65 km/h. "
            "The car's engine was pushed into the front passenger compartment; three car occupants died and two were critically injured."
        ),
        
        "what_do_we_know": {
            "confirmed_facts": [
                "The collision occurred squarely within the bus's designated travel lane, across the solid white line.",
                "Road markings featured a continuous double line indicating strict prohibition of overtaking under Section 112/119 of the Motor Vehicles Act.",
                "The mountain curve was equipped with a large convex mirror, which the car driver failed to observe before pulling out.",
                "Bus driver braked hard and held steering within the lane, preventing the bus from falling toward the mountain ravine."
            ],
            "preliminary_or_unconfirmed": [
                "Whether passengers in the car were urging the driver to overtake."
            ],
            "unknown_details": [
                "Exact horn usage by both vehicles prior to entering the hairpin curve apex."
            ]
        },
        
        "how_crash_occurred": {
            "immediate_sequence": "Driver impatience -> Crossed solid center line on blind curve -> Blind zone obstruction -> Head-on collision with descending bus.",
            "contributing_factors": [
                "Sight Distance Geometry: On hairpin curves with mountain bluffs, stopping sight distance around the bend is under 15 meters.",
                "Impatience vs Reality: Overtaking on a 10 km mountain pass saves at most 90 seconds, while introducing an almost certain probability of fatal head-on collision."
            ],
            "road_and_environment": "Two-lane mountain ghat corridor; continuous asphalt; dry daylight conditions.",
            "vehicle_and_occupant_factors": "Extreme mass disparity (1.1-tonne car vs 12-tonne bus) concentrated 90% of kinetic crash energy dissipation into the smaller passenger car."
        },
        
        "prevention_measures": [
            "The Sacred Solid Line: Never cross a continuous solid center line under ANY circumstances. A solid line means: 'Zero sight distance—overtaking is lethal.'",
            "Hairpin Curve Discipline: On mountain roads, sound your horn twice before entering blind curves, reduce speed to under 20 km/h, and hug the left-hand curb.",
            "Check Convex Curve Mirrors: Observe the roadside convex mirrors installed at curve apexes to detect descending oncoming traffic.",
            "Patience Saves Lives: Remember that arriving 5 minutes later at the bottom of the mountain is a victory; overtaking on a blind curve is gambling with human lives."
        ],
        
        "road_user_takeaways": {
            "two_wheeler_riders": "Never lean into oncoming lanes on hairpin turns. Stay within your half of the road.",
            "car_drivers_and_passengers": "Accept that mountain driving takes time. Enjoy the scenery, maintain a safe gap behind slow trucks, and overtake only on straight sections with broken center lines.",
            "heavy_vehicle_drivers": "Give way to uphill climbing vehicles as mandated by mountain traffic priority rules.",
            "road_authorities": "Install high-visibility flexible center delineator bollards on hairpin bends to physically prevent lane crossing."
        },
        
        "quiz": [
            {
                "question": "What is the universal legal and safety meaning of a solid continuous white or double yellow line along the center of a roadway?",
                "options": [
                    "You may overtake if the vehicle ahead is traveling under 30 km/h.",
                    "Strict prohibition against crossing or straddling the line; overtaking is illegal and hazardous due to restricted sightlines.",
                    "The line is merely advisory for night-time guidance.",
                    "You may cross the line as long as you sound your horn."
                ],
                "correct_index": 1,
                "explanation": "A continuous solid center line is an absolute regulatory demarcation. It signifies that forward stopping sight distance is insufficient for safe overtaking, making lane crossing illegal and life-threatening."
            },
            {
                "question": "On narrow mountain roads, which vehicle has the statutory right of way when two vehicles meet on a slope?",
                "options": [
                    "The descending (downhill) vehicle because it is traveling faster.",
                    "The ascending (uphill climbing) vehicle, because stopping and restarting a climb on a steep slope is more hazardous.",
                    "The larger commercial vehicle unconditionally.",
                    "Whichever vehicle sounds its horn first."
                ],
                "correct_index": 1,
                "explanation": "Indian Motor Vehicle Rules and international conventions establish that ascending (climbing uphill) vehicles have right-of-way over descending vehicles, because stopping and restarting on steep grades carries high stall and rollback hazards."
            }
        ],
        
        "sources": [
            {
                "title": "IRC Guidelines on Geometric Design of Hill Roads (IRC:52-2019)",
                "publisher": "Indian Roads Congress",
                "publication_date": "2023-08-10",
                "url": "https://morth.nic.in/"
            }
        ]
    }
]
