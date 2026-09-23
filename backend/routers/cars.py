from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

import models
import schemas
from database import get_db
from auth import get_current_user, add_audit_log

router = APIRouter(prefix="/cars", tags=["cars"])


@router.get("", response_model=list[schemas.CarOut])
def list_cars(
    status: Optional[str] = None,
    search: Optional[str] = None,
    branch: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    q = db.query(models.Car).filter(models.Car.is_deleted == False)
    if status:
        q = q.filter(models.Car.status == status)
    if branch:
        q = q.filter(models.Car.branch == branch)
    if search:
        like = f"%{search}%"
        q = q.filter(
            (models.Car.name.ilike(like))
            | (models.Car.brand.ilike(like))
            | (models.Car.model.ilike(like))
            | (models.Car.registration_number.ilike(like))
            | (models.Car.chassis_number.ilike(like))
        )
    return q.order_by(models.Car.id.desc()).all()


@router.get("/{car_id}", response_model=schemas.CarOut)
def get_car(car_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    car = db.query(models.Car).filter(models.Car.id == car_id, models.Car.is_deleted == False).first()
    if not car:
        raise HTTPException(status_code=404, detail="Car not found")
    return car


@router.post("", response_model=schemas.CarOut)
def create_car(
    payload: schemas.CarCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    car = models.Car(**payload.model_dump(), created_by=current_user.id)
    db.add(car)
    db.flush()
    add_audit_log(db, current_user.id, "create", "cars", f"Added car {car.name}")
    db.commit()
    db.refresh(car)
    return car


@router.put("/{car_id}", response_model=schemas.CarOut)
def update_car(
    car_id: int,
    payload: schemas.CarUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    car = db.query(models.Car).filter(models.Car.id == car_id, models.Car.is_deleted == False).first()
    if not car:
        raise HTTPException(status_code=404, detail="Car not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(car, field, value)
    add_audit_log(db, current_user.id, "update", "cars", f"Updated car {car.name}")
    db.commit()
    db.refresh(car)
    return car


@router.patch("/{car_id}/status", response_model=schemas.CarOut)
def update_car_status(
    car_id: int,
    payload: schemas.CarStatusUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    car = db.query(models.Car).filter(models.Car.id == car_id, models.Car.is_deleted == False).first()
    if not car:
        raise HTTPException(status_code=404, detail="Car not found")
    car.status = payload.status
    add_audit_log(db, current_user.id, "update", "cars", f"Set {car.name} status to {payload.status}")
    db.commit()
    db.refresh(car)
    return car


@router.delete("/{car_id}")
def delete_car(
    car_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    car = db.query(models.Car).filter(models.Car.id == car_id, models.Car.is_deleted == False).first()
    if not car:
        raise HTTPException(status_code=404, detail="Car not found")
    car.is_deleted = True
    add_audit_log(db, current_user.id, "delete", "cars", f"Deleted car {car.name}", "delete")
    db.commit()
    return {"message": "Car deleted"}
