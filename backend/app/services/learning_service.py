"""
TERA Authoritative Road Safety Learning, XP Engine & Badge Progression Service
Handles server-side validation of activity completions, transactional database persistence,
idempotent reward deduplication, and badge eligibility evaluation.
"""

import uuid
import datetime
from typing import Optional, Dict, Any, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.models import UserLearningProgress, ActivityCompletion, UserBadge, UserAccount

# ------------------------------------------------------------------------------
# Authoritative Server-Side Activity XP Reward Rules
# ------------------------------------------------------------------------------
ACTIVITY_XP_RULES: Dict[str, int] = {
    "LESSON": 10,
    "QUIZ": 10,
    "QUIZ_PERFECT_BONUS": 5,        # Awarded when score >= 80%
    "HAZARD_GAME": 15,
    "SCENARIO": 15,
    "CASE_STUDY": 20,
    "FAMILY_CHALLENGE": 15,
    "DAILY_CHALLENGE": 10,
    "MEMORY_GAME": 15,
    "JOURNEY_GAME": 15,
    "PLEDGE": 120,                  # Special household commitment milestone
}

# ------------------------------------------------------------------------------
# Master Catalog of 15 Definitive Safety Badges
# ------------------------------------------------------------------------------
MASTER_BADGE_CATALOG: List[Dict[str, Any]] = [
    # 1. Getting Started
    {
        "id": "first_safe_choice",
        "title": "First Safe Choice",
        "category": "Getting Started",
        "icon": "CheckCircle2",
        "description": "Completed your first verified road safety activity.",
        "xp_reward": 50,
        "criteria": "Complete any 1 eligible safety activity or decision scenario.",
        "threshold": 1
    },
    {
        "id": "safety_explorer",
        "title": "Safety Explorer",
        "category": "Getting Started",
        "icon": "Compass",
        "description": "Explored and completed 3 distinct learning modules or interactive challenges.",
        "xp_reward": 60,
        "criteria": "Complete at least 3 distinct activities.",
        "threshold": 3
    },
    {
        "id": "knowledge_seeker",
        "title": "Knowledge Seeker",
        "category": "Getting Started",
        "icon": "BookOpen",
        "description": "Demonstrated active commitment by completing 5 road safety quizzes.",
        "xp_reward": 75,
        "criteria": "Complete at least 5 quizzes.",
        "threshold": 5
    },

    # 2. Road User Safety
    {
        "id": "helmet_champion",
        "title": "Helmet Safety Champion",
        "category": "Road User Safety",
        "icon": "Shield",
        "description": "Completed the two-wheeler helmet safety module and passed the impact dissipation assessment.",
        "xp_reward": 80,
        "criteria": "Complete the motorcycle helmet assessment with >= 80% accuracy.",
        "threshold": 1
    },
    {
        "id": "seatbelt_advocate",
        "title": "Seat-Belt Advocate",
        "category": "Road User Safety",
        "icon": "ShieldCheck",
        "description": "Completed the passenger occupant safety module on rear-seat kinetic decoupling.",
        "xp_reward": 80,
        "criteria": "Complete the passenger occupant safety module.",
        "threshold": 1
    },
    {
        "id": "road_sign_explorer",
        "title": "Road Sign Explorer",
        "category": "Road User Safety",
        "icon": "Eye",
        "description": "Mastered regulatory, cautionary, and informatory road signs in the Memory Challenge.",
        "xp_reward": 80,
        "criteria": "Complete the Road Safety Sign Memory Challenge or Sign Quiz.",
        "threshold": 1
    },
    {
        "id": "hazard_spotter",
        "title": "Hazard Spotter",
        "category": "Road User Safety",
        "icon": "AlertTriangle",
        "description": "Identified critical traffic hazards in 3 hazard perception scenarios.",
        "xp_reward": 75,
        "criteria": "Complete at least 3 hazard identification challenges.",
        "threshold": 3
    },
    {
        "id": "journey_planner",
        "title": "Safe Journey Planner",
        "category": "Road User Safety",
        "icon": "Navigation",
        "description": "Conducted a 100% compliant pre-trip vehicular and physical readiness inspection.",
        "xp_reward": 80,
        "criteria": "Complete the Build a Safe Journey activity.",
        "threshold": 1
    },

    # 3. Learning Achievements
    {
        "id": "case_investigator",
        "title": "Case Study Investigator",
        "category": "Learning Achievements",
        "icon": "FileText",
        "description": "Studied 3 documented major accident case studies and passed their evidence-based quizzes.",
        "xp_reward": 100,
        "criteria": "Complete 3 accident case studies and their assessments.",
        "threshold": 3
    },
    {
        "id": "safety_scholar",
        "title": "Road Safety Scholar",
        "category": "Learning Achievements",
        "icon": "GraduationCap",
        "description": "Maintained an overall quiz accuracy rate of 80% or greater across multiple topics.",
        "xp_reward": 100,
        "criteria": "Achieve >= 80% quiz accuracy on at least 3 quizzes.",
        "threshold": 80
    },
    {
        "id": "prevention_advocate",
        "title": "Prevention Advocate",
        "category": "Learning Achievements",
        "icon": "HeartHandshake",
        "description": "Completed 5 distinct accident prevention lessons in the Safety Learning Library.",
        "xp_reward": 120,
        "criteria": "Complete 5 distinct prevention modules.",
        "threshold": 5
    },
    {
        "id": "family_advocate",
        "title": "Family Safety Advocate",
        "category": "Learning Achievements",
        "icon": "Heart",
        "description": "Completed the Family Safety Challenge and signed an official household pledge.",
        "xp_reward": 120,
        "criteria": "Sign the Certified Family Road-Safety Pledge.",
        "threshold": 1
    },

    # 4. Consistency
    {
        "id": "three_day_learner",
        "title": "Three-Day Learner",
        "category": "Consistency",
        "icon": "Flame",
        "description": "Maintained defensive learning consistency by completing safety activities on 3 days.",
        "xp_reward": 100,
        "criteria": "Reach a 3-day learning streak.",
        "threshold": 3
    },
    {
        "id": "seven_day_learner",
        "title": "Seven-Day Learner",
        "category": "Consistency",
        "icon": "Sparkles",
        "description": "Maintained an unbroken 7-day defensive driving and accident prevention streak.",
        "xp_reward": 150,
        "criteria": "Reach a 7-day learning streak.",
        "threshold": 7
    },

    # 5. Mastery
    {
        "id": "road_safety_master",
        "title": "Road Safety Master",
        "category": "Mastery",
        "icon": "Award",
        "description": "Attained Tier 4 Guardian ranking with comprehensive mastery of all TERA Explore domains.",
        "xp_reward": 250,
        "criteria": "Accumulate 500+ XP and earn at least 5 badges.",
        "threshold": 500
    }
]

class LearningProgressionService:
    @staticmethod
    def get_or_create_user_progress(
        db: Session,
        user_key: str,
        current_user: Optional[UserAccount] = None
    ) -> UserLearningProgress:
        """
        Retrieves persistent UserLearningProgress record or creates a clean baseline.
        """
        prog = db.query(UserLearningProgress).filter(UserLearningProgress.user_key == user_key).first()
        if not prog:
            prog_id = f"ULP_{uuid.uuid4().hex[:12]}"
            username = "Safety Explorer (Guest)"
            user_id = None
            if current_user:
                username = current_user.full_name or current_user.username
                user_id = current_user.user_id

            prog = UserLearningProgress(
                id=prog_id,
                user_key=user_key,
                user_id=user_id,
                session_id=user_key if not current_user else None,
                username=username,
                total_xp=100,  # Baseline welcome safety XP
                level=1,
                level_title="Defensive Scout",
                quizzes_completed=0,
                quiz_accuracy_pct=0.0,
                games_completed=0,
                lessons_read=0,
                case_studies_completed=0,
                streak_days=1,
                pledge_signed=False,
                pledge_name=None,
                last_activity_at=datetime.datetime.utcnow(),
                created_at=datetime.datetime.utcnow()
            )
            db.add(prog)
            
            # Award introductory First Safe Choice achievement baseline if appropriate
            baseline_badge = UserBadge(
                badge_award_id=f"UB_{uuid.uuid4().hex[:12]}",
                user_key=user_key,
                badge_id="first_safe_choice",
                badge_title="First Safe Choice",
                badge_category="Getting Started",
                xp_reward=50,
                reason="Welcome to TERA Road Safety Academy",
                earned_at=datetime.datetime.utcnow(),
                idempotency_key=f"{user_key}:first_safe_choice"
            )
            try:
                db.add(baseline_badge)
                db.commit()
                db.refresh(prog)
            except Exception:
                db.rollback()
                prog = db.query(UserLearningProgress).filter(UserLearningProgress.user_key == user_key).first()
        return prog

    @staticmethod
    def record_activity_completion(
        db: Session,
        user_key: str,
        activity_type: str,
        activity_id: str,
        score: float = 100.0,
        passed: bool = True,
        metadata: Optional[Dict[str, Any]] = None,
        current_user: Optional[UserAccount] = None,
        custom_xp: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Authoritatively validates activity completion, computes server-side XP,
        commits to database, checks for badge unlocks, and updates user progression.
        """
        norm_type = activity_type.upper().strip()
        idempotency_key = f"{user_key}:{norm_type}:{activity_id}"
        
        # 1. Check if already completed (Prevents duplicate XP awards)
        existing_completion = db.query(ActivityCompletion).filter(
            ActivityCompletion.idempotency_key == idempotency_key
        ).first()

        prog = LearningProgressionService.get_or_create_user_progress(db, user_key, current_user)

        if existing_completion:
            # Activity already completed - return authoritative progress without re-awarding XP
            badges = db.query(UserBadge).filter(UserBadge.user_key == user_key).all()
            return {
                "status": "already_completed",
                "message": f"Activity '{activity_id}' was already completed. No duplicate XP awarded.",
                "xp_awarded": 0,
                "current_total_xp": prog.total_xp,
                "current_level": prog.level,
                "current_level_title": prog.level_title,
                "newly_unlocked_badges": [],
                "earned_badges": [b.badge_id for b in badges]
            }

        if not passed:
            return {
                "status": "not_passed",
                "message": "Activity was not passed. Review safety guidelines and try again.",
                "xp_awarded": 0,
                "current_total_xp": prog.total_xp,
                "current_level": prog.level,
                "current_level_title": prog.level_title,
                "newly_unlocked_badges": [],
                "earned_badges": [b.badge_id for b in db.query(UserBadge).filter(UserBadge.user_key == user_key).all()]
            }

        # 2. Authoritative XP Calculation from Rules
        if custom_xp is not None and custom_xp > 0:
            base_xp = custom_xp
        else:
            base_xp = ACTIVITY_XP_RULES.get(norm_type, 10)
        bonus_xp = 0
        if norm_type == "QUIZ" and score >= 80.0 and (custom_xp is None):
            bonus_xp = ACTIVITY_XP_RULES.get("QUIZ_PERFECT_BONUS", 5)

        total_awarded_xp = base_xp + bonus_xp

        # 3. Insert ActivityCompletion record
        completion = ActivityCompletion(
            completion_id=f"CMP_{uuid.uuid4().hex[:12]}",
            user_key=user_key,
            activity_type=norm_type,
            activity_id=activity_id,
            score=score,
            passed=passed,
            xp_awarded=total_awarded_xp,
            idempotency_key=idempotency_key,
            metadata_json=metadata or {},
            completed_at=datetime.datetime.utcnow()
        )
        db.add(completion)

        # 4. Update Aggregate Stats in UserLearningProgress
        prog.total_xp += total_awarded_xp
        prog.last_activity_at = datetime.datetime.utcnow()

        if norm_type in ["SCENARIO", "HAZARD_GAME", "MEMORY_GAME", "JOURNEY_GAME", "FAMILY_CHALLENGE"]:
            prog.games_completed += 1
        elif norm_type == "QUIZ":
            # Update running quiz accuracy
            prev_total = prog.quizzes_completed
            prog.quiz_accuracy_pct = round(((prog.quiz_accuracy_pct * prev_total) + score) / (prev_total + 1), 1)
            prog.quizzes_completed += 1
        elif norm_type == "LESSON":
            prog.lessons_read += 1
        elif norm_type == "CASE_STUDY":
            prog.case_studies_completed += 1
            prog.lessons_read += 1
        elif norm_type == "PLEDGE":
            prog.pledge_signed = True
            if metadata and "pledge_name" in metadata:
                prog.pledge_name = metadata["pledge_name"]

        # Level Calculation
        if prog.total_xp >= 500:
            prog.level = 4
            prog.level_title = "Road Safety Guardian"
        elif prog.total_xp >= 250:
            prog.level = 3
            prog.level_title = "Defensive Champion"
        elif prog.total_xp >= 100:
            prog.level = 2
            prog.level_title = "Cautious Commuter"
        else:
            prog.level = 1
            prog.level_title = "Defensive Scout"

        db.commit()
        db.refresh(prog)

        # 5. Check and Unlock Eligible Badges
        newly_unlocked = LearningProgressionService.evaluate_badge_unlocks(db, user_key, prog)

        all_badges = db.query(UserBadge).filter(UserBadge.user_key == user_key).all()

        return {
            "status": "success",
            "message": f"Earned +{total_awarded_xp} XP for completing {norm_type.lower().replace('_', ' ')}!",
            "xp_awarded": total_awarded_xp,
            "current_total_xp": prog.total_xp,
            "current_level": prog.level,
            "current_level_title": prog.level_title,
            "newly_unlocked_badges": newly_unlocked,
            "earned_badges": [b.badge_id for b in all_badges]
        }

    @staticmethod
    def evaluate_badge_unlocks(
        db: Session,
        user_key: str,
        prog: UserLearningProgress
    ) -> List[Dict[str, Any]]:
        """
        Evaluates user completion history against the 15 master badge criteria
        and persists newly unlocked badges.
        """
        existing_badge_ids = set(
            row[0] for row in db.query(UserBadge.badge_id).filter(UserBadge.user_key == user_key).all()
        )
        newly_unlocked = []

        total_completions = db.query(func.count(ActivityCompletion.completion_id)).filter(
            ActivityCompletion.user_key == user_key
        ).scalar() or 0

        # Badge checks
        checks: List[Tuple[str, bool, str]] = [
            ("first_safe_choice", total_completions >= 1, "Completed first road safety activity"),
            ("safety_explorer", (prog.games_completed + prog.lessons_read + prog.case_studies_completed) >= 3, "Completed 3 distinct modules"),
            ("knowledge_seeker", prog.quizzes_completed >= 5, "Completed 5 safety quizzes"),
            ("hazard_spotter", db.query(func.count(ActivityCompletion.completion_id)).filter(
                ActivityCompletion.user_key == user_key,
                ActivityCompletion.activity_type == "HAZARD_GAME"
            ).scalar() >= 3, "Mastered 3 hazard perception challenges"),
            ("journey_planner", db.query(func.count(ActivityCompletion.completion_id)).filter(
                ActivityCompletion.user_key == user_key,
                ActivityCompletion.activity_type == "JOURNEY_GAME"
            ).scalar() >= 1, "Completed pre-trip vehicle inspection"),
            ("case_investigator", prog.case_studies_completed >= 3, "Completed 3 documented case studies"),
            ("safety_scholar", prog.quizzes_completed >= 3 and prog.quiz_accuracy_pct >= 80.0, "Achieved >= 80% quiz mastery"),
            ("prevention_advocate", prog.lessons_read >= 5, "Completed 5 prevention modules"),
            ("family_advocate", prog.pledge_signed == True, "Signed certified family road safety pledge"),
            ("three_day_learner", prog.streak_days >= 3, "Maintained 3-day learning streak"),
            ("seven_day_learner", prog.streak_days >= 7, "Maintained 7-day learning streak"),
            ("road_safety_master", prog.level >= 4 and prog.total_xp >= 500, "Attained Tier 4 Guardian ranking")
        ]

        # Activity specific badges (Helmet & Seatbelt modules)
        has_helmet = db.query(ActivityCompletion).filter(
            ActivityCompletion.user_key == user_key,
            ActivityCompletion.activity_id.ilike("%helmet%")
        ).first() is not None
        if has_helmet:
            checks.append(("helmet_champion", True, "Completed motorcycle helmet module"))

        has_seatbelt = db.query(ActivityCompletion).filter(
            ActivityCompletion.user_key == user_key,
            ActivityCompletion.activity_id.ilike("%seatbelt%")
        ).first() is not None
        if has_seatbelt:
            checks.append(("seatbelt_advocate", True, "Completed occupant seatbelt module"))

        has_signs = db.query(ActivityCompletion).filter(
            ActivityCompletion.user_key == user_key,
            ActivityCompletion.activity_type.in_(["MEMORY_GAME", "QUIZ"]),
            ActivityCompletion.activity_id.ilike("%sign%")
        ).first() is not None
        if has_signs:
            checks.append(("road_sign_explorer", True, "Completed road sign challenge"))

        for badge_id, is_eligible, reason in checks:
            if is_eligible and badge_id not in existing_badge_ids:
                badge_def = next((b for b in MASTER_BADGE_CATALOG if b["id"] == badge_id), None)
                if not badge_def:
                    continue

                new_badge = UserBadge(
                    badge_award_id=f"UB_{uuid.uuid4().hex[:12]}",
                    user_key=user_key,
                    badge_id=badge_id,
                    badge_title=badge_def["title"],
                    badge_category=badge_def["category"],
                    xp_reward=badge_def["xp_reward"],
                    reason=reason,
                    earned_at=datetime.datetime.utcnow(),
                    idempotency_key=f"{user_key}:{badge_id}"
                )
                try:
                    db.add(new_badge)
                    # Award bonus XP for earning badge
                    prog.total_xp += badge_def["xp_reward"]
                    db.commit()
                    existing_badge_ids.add(badge_id)
                    newly_unlocked.append({
                        "id": badge_id,
                        "title": badge_def["title"],
                        "category": badge_def["category"],
                        "description": badge_def["description"],
                        "icon": badge_def["icon"],
                        "xp_reward": badge_def["xp_reward"],
                        "earned_at": new_badge.earned_at.strftime("%Y-%m-%d")
                    })
                except Exception:
                    db.rollback()

        return newly_unlocked

    @staticmethod
    def get_badge_catalog_with_status(
        db: Session,
        user_key: str
    ) -> List[Dict[str, Any]]:
        """
        Returns all 15 master badges annotated with user's earned/locked status,
        date earned, and current progress toward unlock.
        """
        user_badges = {
            b.badge_id: b for b in db.query(UserBadge).filter(UserBadge.user_key == user_key).all()
        }
        prog = db.query(UserLearningProgress).filter(UserLearningProgress.user_key == user_key).first()

        result = []
        for badge_def in MASTER_BADGE_CATALOG:
            b_id = badge_def["id"]
            user_b = user_badges.get(b_id)
            is_unlocked = user_b is not None

            # Calculate progress for locked achievements
            curr_val = 0
            max_val = badge_def.get("threshold", 1)
            
            if is_unlocked:
                curr_val = max_val
            elif prog:
                if b_id == "first_safe_choice":
                    curr_val = 1 if (prog.games_completed + prog.quizzes_completed + prog.lessons_read) > 0 else 0
                elif b_id == "safety_explorer":
                    curr_val = min(3, prog.games_completed + prog.lessons_read + prog.case_studies_completed)
                elif b_id == "knowledge_seeker":
                    curr_val = min(5, prog.quizzes_completed)
                elif b_id == "hazard_spotter":
                    curr_val = min(3, db.query(func.count(ActivityCompletion.completion_id)).filter(
                        ActivityCompletion.user_key == user_key,
                        ActivityCompletion.activity_type == "HAZARD_GAME"
                    ).scalar() or 0)
                elif b_id == "case_investigator":
                    curr_val = min(3, prog.case_studies_completed)
                elif b_id == "safety_scholar":
                    curr_val = int(prog.quiz_accuracy_pct) if prog.quizzes_completed >= 3 else 0
                elif b_id == "prevention_advocate":
                    curr_val = min(5, prog.lessons_read)
                elif b_id == "family_advocate":
                    curr_val = 1 if prog.pledge_signed else 0
                elif b_id == "three_day_learner":
                    curr_val = min(3, prog.streak_days)
                elif b_id == "seven_day_learner":
                    curr_val = min(7, prog.streak_days)
                elif b_id == "road_safety_master":
                    curr_val = min(500, prog.total_xp)

            result.append({
                "id": b_id,
                "title": badge_def["title"],
                "category": badge_def["category"],
                "icon": badge_def["icon"],
                "description": badge_def["description"],
                "criteria": badge_def["criteria"],
                "xp_reward": badge_def["xp_reward"],
                "unlocked": is_unlocked,
                "earned_at": user_b.earned_at.strftime("%Y-%m-%d") if user_b else None,
                "reason": user_b.reason if user_b else None,
                "current_progress": curr_val,
                "max_progress": max_val,
                "progress_percentage": min(100, int((curr_val / max(1, max_val)) * 100))
            })

        return result
