from datetime import datetime, timedelta
from dataclasses import dataclass


@dataclass
class SM2Result:
    ease_factor: float
    interval_days: int
    next_review: datetime


def calculate_sm2(ease_factor: float, interval_days: int, quality: int) -> SM2Result:
    """
    SM-2 spaced repetition algorithm.
    quality: 0-5 (0=complete blackout, 5=perfect response)
    """
    if quality < 3:
        new_interval = 1
        new_ease = ease_factor
    else:
        new_ease = ease_factor + 0.1 - (5 - quality) * 0.08
        new_ease = max(1.3, new_ease)

        if interval_days <= 1:
            new_interval = 1
        elif interval_days == 2:
            new_interval = 6
        else:
            new_interval = round(interval_days * new_ease)

        ease_factor = new_ease
        new_interval = new_interval

    new_ease = ease_factor if quality < 3 else new_ease
    next_review = datetime.utcnow() + timedelta(days=new_interval if quality >= 3 else 1)

    return SM2Result(
        ease_factor=round(new_ease, 2),
        interval_days=new_interval if quality >= 3 else 1,
        next_review=next_review,
    )
