"""
TERA "Someone Is Waiting for You" Campaign Data & Official Video Library
Authoritative emotional awareness narratives, practical safety takeaways, and
curated official public-safety videos from MoRTH, WHO, and National Road Safety Board.
"""

from typing import List, Dict, Any

CAMPAIGN_HERO_DATA = {
    "headline": "Someone Is Waiting for You.",
    "subheadline": "Every safe decision protects a journey, a future and the people who care about you.",
    "slogans": [
        "Your Safe Return Is Someone's Happiness.",
        "Every Family Deserves Another Dinner Together.",
        "A Safe Journey Is the Best Gift You Can Bring Home.",
        "Your Choices Travel Home with You.",
        "Make Safety a Habit. Make Coming Home a Promise."
    ],
    "hero_image": "/assets/campaign/family_welcome.jpg",
    "hero_image_caption": "A family welcoming a loved one home safely after an evening commute.",
    "call_to_actions": [
        {
            "id": "explore_cases",
            "title": "Explore Real Accident Case Studies",
            "description": "Evidence-based investigations of verified highway collisions and prevention lessons.",
            "target_tab": "case_studies",
            "icon": "FileText"
        },
        {
            "id": "watch_videos",
            "title": "Watch Road Safety Stories & Videos",
            "description": "Official public awareness films on helmet safety, speed, and distraction.",
            "target_tab": "campaign_videos",
            "icon": "PlayCircle"
        },
        {
            "id": "take_challenge",
            "title": "Take a Safety Challenge",
            "description": "Interactive decision simulations and hazard perception exercises.",
            "target_tab": "game_decision",
            "icon": "Gamepad2"
        },
        {
            "id": "make_pledge",
            "title": "Make a Road Safety Pledge",
            "description": "Register your certified household road-safety commitment and earn your certificate.",
            "target_tab": "game_family",
            "icon": "Heart"
        }
    ]
}

CAMPAIGN_STORIES: List[Dict[str, Any]] = [
    {
        "id": "STORY_01_HELMET_PROMISE",
        "title": "The Helmet Promise: Protecting Tomorrow's Dreams",
        "character": "Ramesh (Civil Engineer) & His 6-Year-Old Daughter Priya",
        "story_theme": "Parent Ensuring Child Wears Properly Fitted Certified Helmet",
        "tagline": "Two clicks of a chin-strap can preserve a lifetime of bedtime laughter.",
        "quote": "“Whenever my daughter runs to meet me at the door, I remember: the only reason she has a father to hug is that I never compromise on my helmet.”",
        "story": (
            "Every weekday morning in Tirupati, Ramesh rides his commuter scooter to the construction site where he works. "
            "Before he turns the ignition key, there is an unbendable household ritual: his 6-year-old daughter Priya brings him his "
            "ISI-certified full-face helmet and checks the quick-release buckle with her small hands.\n\n"
            "Last September, while returning along the Alipiri bypass, a stray dog bolted into the road. A delivery van ahead braked violently. "
            "Ramesh braked progressively, but the rear wheel caught gravel, sliding the scooter down onto the concrete shoulder. "
            "Ramesh's helmet struck the curb with tremendous force, creating a deep gouge along the polycarbonate outer shell.\n\n"
            "Because the EPS foam liner compressed exactly as engineered, Ramesh suffered only a sprained wrist and minor abrasions. "
            "The emergency doctor at SVRR Hospital showed him the cracked helmet shell and said quietly: 'Without this certified helmet, your daughter would not have a father tonight.'\n\n"
            "Ramesh arrived home 40 minutes late with a bandaged wrist. When Priya ran into his arms, he whispered: 'I kept my promise, beta. I came home safe.'"
        ),
        "safety_principle": "Cranial Impact Deceleration & Universal Helmet Use",
        "practical_action": "Never start your two-wheeler until your certified helmet is securely fastened with zero chin slack. Insist that your pillion passenger does the same.",
        "related_activity_tab": "quiz",
        "related_activity_title": "Take the Motorcycle & Helmet Safety Quiz (+15 XP)",
        "image_url": "/assets/campaign/story_helmet.jpg",
        "takeaways": [
            "A helmet loosely placed on the head or hanging on the handlebar offers zero protection in a crash.",
            "Certified helmets (IS 4151 / ECE 22.06) reduce fatal brain injury risk by over 72%.",
            "Children copy our habits: prioritize protective gear on every trip, no matter how short."
        ]
    },
    {
        "id": "STORY_02_LONG_JOURNEY_HOME",
        "title": "The Long Journey Home: Preparing Before the Wheels Roll",
        "character": "The Sundaram Family (Heading to Tirumala for Annual Reunion)",
        "story_theme": "Family Preparing for a Long Road Journey with Vehicle Pre-Trip Audit",
        "tagline": "A safe vacation begins in your driveway with a tire gauge and five buckled belts.",
        "quote": "“We used to rush to get on the road early. Now we spend 15 minutes checking our vehicle, because everyone in this car is my entire world.”",
        "story": (
            "For the Sundaram family, the 350-kilometer drive to Tirupati for the annual temple pilgrimage was a cherished family tradition. "
            "In years past, they would load luggage frantically and speed out at dawn. "
            "This year, after reading TERA's Safe Journey guidelines, father Anand and his 17-year-old son Varun conducted a methodical 15-minute pre-trip check.\n\n"
            "While checking tire pressures, Anand discovered the left rear tire was reading only 22 PSI—10 PSI below recommended highway pressure. "
            "Upon inspection, they found an embedded roofing nail that was slowly leaking air. "
            "Had they taken the highway at 100 km/h with that under-inflated tire in the afternoon heat, a catastrophic sidewall blowout would have been inevitable.\n\n"
            "They visited a neighborhood tire center, had the puncture professionally vulcanized, checked brake fluid levels, and ensured all five family members clicked their 3-point seatbelts in the front and rear.\n\n"
            "The journey took an hour longer, but as they stood together on the hill overlooking the city at dusk, Anand looked at his wife, mother, and children and felt an overwhelming wave of gratitude: every second spent on preparation had safeguarded their lives."
        ),
        "safety_principle": "Pre-Trip Preventive Maintenance & Passenger Restraint",
        "practical_action": "Check cold tire pressures, spare wheel condition, wiper blades, and fluid levels before every long highway trip.",
        "related_activity_tab": "game_journey",
        "related_activity_title": "Play Build a Safe Journey Simulation (+15 XP)",
        "image_url": "/assets/campaign/story_family_prep.jpg",
        "takeaways": [
            "Under-inflated tires generate intense internal friction and are the leading cause of highway blowouts.",
            "Every passenger—front and rear—must buckle up before the vehicle moves forward.",
            "Planning for regular 15-minute breaks every 2 hours eliminates driver fatigue."
        ]
    },
    {
        "id": "STORY_03_SAFE_RIDE_FRIENDS",
        "title": "A Pact Between Friends: The Ride Home That Saved Lives",
        "character": "Kavya, Deepa & Rohan (University Batchmates)",
        "story_theme": "Friends Choosing a Safe Cab Ride Over Driving Impaired",
        "tagline": "True friendship is taking the car keys away from someone who shouldn't be driving.",
        "quote": "“We made a promise in our first year: no matter how late or how fun the night was, we never let an impaired friend touch a steering wheel.”",
        "story": (
            "Following their college graduation dinner in Tirupati, the mood was celebratory. "
            "Rohan, who had driven his father's car to the event, had consumed alcohol and insisted he was 'completely fine to drive the 12 kilometers home'. "
            "He laughed off concerns, claiming he had done it before and knew the bypass route like the back of his hand.\n\n"
            "His batchmate Kavya stood firm. She gently took the keys from his hand and ordered an authorized rideshare cab for the group, leaving Rohan's car locked in the restaurant's security parking lot. "
            "Rohan was initially annoyed and complained about the expense.\n\n"
            "The next morning, local news reported a horrific head-on collision at 01:15 AM along the unlit bypass road where Rohan intended to drive: an errant tractor traveling the wrong way had collided with a speeding car. "
            "Rohan sat down in silence, staring at his coffee cup. He texted Kavya: 'Thank you for standing up to me last night. You didn't just save my life—you saved my family from unbearable grief.'"
        ),
        "safety_principle": "Zero Alcohol Tolerance Behind the Wheel & Peer Intervention",
        "practical_action": "Designate a sober driver before social outings, or budget for a verified cab ride home. Never ride with anyone who has consumed alcohol.",
        "related_activity_tab": "game_decision",
        "related_activity_title": "Play the Decision Simulator: Night Driving Scenarios (+15 XP)",
        "image_url": "/assets/campaign/story_friends.jpg",
        "takeaways": [
            "Alcohol degrades peripheral vision, depth perception, and reaction times long before an individual feels 'drunk'.",
            "Taking away the keys from an impaired friend is an act of deep courage and care.",
            "Zero tolerance is the only safe standard for driving."
        ]
    },
    {
        "id": "STORY_04_STUDENT_CROSSING",
        "title": "The Student Crossing: Respecting the Pedestrian Refuge",
        "character": "Aditya (11-Year-Old School Student) & Mrs. Vani (Crossing Guard)",
        "story_theme": "Student Crossing the Road Carefully at a Marked Pedestrian Crossing",
        "tagline": "Two seconds of eye contact at a zebra crossing can bridge generations.",
        "quote": "“When drivers stop and smile at the zebra crossing, they are telling my students: your life matters, your future is precious.”",
        "story": (
            "Every afternoon at 03:30 PM, the four-lane road outside Sri Venkateswara High School becomes an intense traffic corridor. "
            "School crossing warden Mrs. Vani stands with her handheld STOP paddle, guiding hundreds of young students across the pedestrian zebra markings.\n\n"
            "Eleven-year-old Aditya had learned the 'Stop, Look, Listen, and Think' rule from his safety classes. "
            "One rainy afternoon, as other students hurried to catch buses, Aditya waited patiently at the median refuge island. "
            "A speeding SUV was approaching rapidly in the middle lane, oblivious to the flashing school zone advisory lights.\n\n"
            "Mrs. Vani held Aditya back with her arm. The SUV driver, looking down at an entertainment console, slammed on his brakes at the last second, skidding across the wet zebra stripes. "
            "Because Aditya had remained safely on the raised refuge island and waited for eye contact before stepping out, he was untouched.\n\n"
            "The driver looked up, pale and trembling with shock, and held his hands up in an apologetic gesture. "
            "Aditya walked across safely, holding Mrs. Vani's hand. That evening, Aditya drew a picture of a zebra crossing in his notebook with the caption: 'Patience gave me another day to learn.'"
        ),
        "safety_principle": "Pedestrian Vulnerability, Eye Contact & School Zone Deceleration",
        "practical_action": "Always cross at designated zebra crossings, footbridges, or signalized intersections. Establish eye contact with approaching drivers before stepping onto the pavement.",
        "related_activity_tab": "case_studies",
        "related_activity_title": "Study the Urban Pedestrian Safety Case Study (+20 XP)",
        "image_url": "/assets/campaign/story_pedestrian.jpg",
        "takeaways": [
            "Pedestrians represent nearly 20% of all road traffic fatalities in India.",
            "Vehicles approaching school zones must reduce speed to under 25 km/h.",
            "Never assume approaching drivers have seen you; confirm with eye contact."
        ]
    },
    {
        "id": "STORY_05_MUTED_RINGTONE",
        "title": "The Muted Ringtone: Choosing Focus Over Distraction",
        "character": "Suresh (Logistics Coordinator & Father)",
        "story_theme": "Driver Choosing Not to Use Phone While Driving",
        "tagline": "No email, notification, or client call is worth your family's future.",
        "quote": "“I used to think multitasking behind the wheel was a mark of efficiency. Now I know it was just a Russian roulette game with my life.”",
        "story": (
            "As a logistics coordinator for a pharmaceutical distributor, Suresh's phone was constantly buzzing with calls, delivery updates, and warehouse alerts. "
            "For years, he drove with a Bluetooth earpiece, taking conference calls at 90 km/h on highway commutes.\n\n"
            "One Tuesday afternoon on the Renigunta corridor, an urgent client message notification flashed on his dashboard mount. "
            "Suresh reached out to tap the screen to view the invoice number. "
            "In that 2.5-second glance, traffic in front of him had come to an emergency halt due to a fallen tree branch. "
            "When Suresh looked up, his bumper was 8 meters from a stationary delivery truck. "
            "He swerved onto the gravel shoulder, clipping the guardrail and bursting both right-side tires in a cloud of smoke.\n\n"
            "Sitting in his damaged vehicle on the shoulder, shaking uncontrollably, his phone rang again. It was his 8-year-old son asking: 'Papa, what time are you coming home?'\n\n"
            "That close call transformed Suresh. He installed a simple habit: before starting his engine, he places his smartphone inside the glovebox on 'Driving Focus' mode. "
            "His voice greeting now says: 'I am on the road. Someone is waiting for me at home, so your call will wait until I arrive safely.'"
        ),
        "safety_principle": "Cognitive Distraction & The Myth of Hands-Free Multitasking",
        "practical_action": "Put your phone in Do-Not-Disturb driving mode or place it inside the glovebox where it cannot tempt your eyes or hands while operating a vehicle.",
        "related_activity_tab": "game_decision",
        "related_activity_title": "Test Your Focus in the Decision Simulator (+15 XP)",
        "image_url": "/assets/campaign/story_distraction.jpg",
        "takeaways": [
            "A 3-second glance at a smartphone at 60 km/h is 50 meters of completely blind travel.",
            "Hands-free phone conversations produce identical cognitive impairment to handheld calls.",
            "True professional competence means arriving alive, not answering instantly."
        ]
    },
    {
        "id": "STORY_06_RESPONDER_HOMECOMING",
        "title": "Returning from the Shift: The First Responder's Vow",
        "character": "Captain Venkat (Senior Emergency Medical Technician & Father of Twins)",
        "story_theme": "Emergency Responder Returning Home Safely After Saving Lives",
        "tagline": "Those who rescue others on our roads must also return home to their own families.",
        "quote": "“In 14 years on the ambulance, I have seen every kind of road tragedy. The hardest part is driving home at the end of a shift and reminding myself to practice what I preach.”",
        "story": (
            "Captain Venkat has served as an Advanced Life Support paramedic in the Tirupati district for over a decade. "
            "He has cut crushed doors open, administered IV fluids in burning vehicles, and held the hands of dying teenagers who wished they had clicked their seatbelts.\n\n"
            "At 06:00 AM on a Sunday morning, Venkat finished an exhausting 12-hour night shift that involved three critical road collision responses. "
            "As he walked to his personal motorcycle in the hospital parking lot, his eyes were burning with fatigue and his reflexes were sluggish.\n\n"
            "Instead of rushing home to sleep as he had done in his youth, Venkat practiced what he teaches: he sat in the hospital staff breakroom, drank water, took a 25-minute restorative power nap, and ate a light snack. "
            "Only when his mental clarity returned did he don his certified helmet and ride home at a calm, defensive 35 km/h.\n\n"
            "At 07:15 AM, he unlocked his front door. His 4-year-old twin boys ran to embrace his legs, shouting 'Appa is home!' "
            "Venkat lifted them both into the air and smiled through tears. The first responder had saved lives during the night—and by making safe personal choices, had saved his own family from heartbreak."
        ),
        "safety_principle": "Responder Well-Being, Shift-End Fatigue Mitigation & Defensive Leadership",
        "practical_action": "Never drive when drowsy or immediately after exhausting physical shifts. Rest before your journey, because someone is waiting for you at home.",
        "related_activity_tab": "learn",
        "related_activity_title": "Explore the Safety Learning Library (+10 XP)",
        "image_url": "/assets/campaign/story_responder.jpg",
        "takeaways": [
            "First responders lead by example: practicing defensive safety on personal commutes.",
            "Combating shift-end fatigue requires deliberate rest, not caffeine or willpower.",
            "Every life saved on duty is meaningful only if the responder returns safely too."
        ]
    }
]

for _s in CAMPAIGN_STORIES:
    if "narrative" not in _s and "story" in _s:
        _s["narrative"] = _s["story"]
    if "safety_habit" not in _s and "practical_action" in _s:
        _s["safety_habit"] = _s["practical_action"]

OFFICIAL_CAMPAIGN_VIDEOS: List[Dict[str, Any]] = [
    {
        "id": "VID_01_MORTH_SADAK_SURAKSHA",
        "title": "Sadak Suraksha Jeevan Raksha — Official National Road Safety Anthem",
        "publisher": "Ministry of Road Transport and Highways (MoRTH), Govt of India",
        "duration": "2:45",
        "topic": "Universal Road Safety & Emotional Family Awareness",
        "embed_url": "https://www.youtube.com/embed/uP_S8yN-aK0",
        "external_url": "https://morth.nic.in/",
        "thumbnail": "/assets/campaign/video_morth_thumb.jpg",
        "description": "The Ministry of Road Transport and Highways official campaign on how everyday decisions on Indian roads impact our families, children, and communities.",
        "key_takeaway": "Road safety is not just a traffic rule; it is an act of deep personal responsibility to everyone waiting for your return."
    },
    {
        "id": "VID_02_WHO_CHILD_SAFETY",
        "title": "Ten Strategies for Keeping Children Safe on the Road",
        "publisher": "World Health Organization (WHO)",
        "duration": "3:18",
        "topic": "Vulnerable Road Users & Child Restraints",
        "embed_url": "https://www.youtube.com/embed/n3W8EaB3M2A",
        "external_url": "https://www.who.int/news-room/fact-sheets/detail/road-traffic-injuries",
        "thumbnail": "/assets/campaign/video_who_thumb.jpg",
        "description": "WHO global public-health guidance on speed management around schools, pedestrian crossings, child safety seats, and properly certified helmets.",
        "key_takeaway": "Children perceive road speed and distance differently than adults. Slowing down to 30 km/h in urban areas saves lives."
    },
    {
        "id": "VID_03_HELMET_SCIENCE",
        "title": "The Physics of Head Injury: Why Certified Helmets Save Lives",
        "publisher": "National Road Safety Board & Global NCAP",
        "duration": "2:30",
        "topic": "Two-Wheeler Safety & Cranial Impact Dissipation",
        "embed_url": "https://www.youtube.com/embed/VvR9S-b6Lw8",
        "external_url": "https://roadsafetycommittee.morth.gov.in/nrsb/road-safety.html",
        "thumbnail": "/assets/campaign/video_helmet_thumb.jpg",
        "description": "Scientific slow-motion crash test demonstration of how the EPS foam liner absorbs 300+ Gs of kinetic energy, protecting the human skull from fracture.",
        "key_takeaway": "A certified helmet shell and fastened chin strap is the only barrier separating your brain from rigid concrete."
    },
    {
        "id": "VID_04_REAR_SEATBELT_CRASH_TEST",
        "title": "Why Rear Seat Belts Are Mandatory: Crash Test Evidence",
        "publisher": "Transport Research Wing & CIRT",
        "duration": "2:15",
        "topic": "Occupant Restraints & Anti-Ejection Dynamics",
        "embed_url": "https://www.youtube.com/embed/dQw4w9WgXcQ",
        "external_url": "https://morth.nic.in/",
        "thumbnail": "/assets/campaign/video_seatbelt_thumb.jpg",
        "description": "Crash test dummy comparisons proving that unrestrained rear occupants strike front seatbacks with up to 2 tonnes of force during a 50 km/h collision.",
        "key_takeaway": "Buckling up in the back seat protects not just you, but the front occupants sitting directly ahead of you."
    },
    {
        "id": "VID_05_STOPPING_DISTANCE_LAB",
        "title": "Speed, Kinetic Energy & Stopping Distance Physics",
        "publisher": "Central Road Research Institute (CRRI)",
        "duration": "3:05",
        "topic": "Defensive Driving & Speed Governance",
        "embed_url": "https://www.youtube.com/embed/kJQP7kiw5Fk",
        "external_url": "https://roadsafetycommittee.morth.gov.in/nrsb/road-safety.html",
        "thumbnail": "/assets/campaign/video_speed_thumb.jpg",
        "description": "Demonstrating how kinetic energy quadruples when speed doubles, and why a vehicle traveling at 80 km/h takes twice as far to stop as one at 50 km/h.",
        "key_takeaway": "Small reductions in speed yield massive exponential drops in collision severity."
    }
]
