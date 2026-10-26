from pydantic import BaseModel, Field


class JobCreate(BaseModel):
    title: str = Field(default="Untitled Role", max_length=255)
    description: str = Field(min_length=10)


class JobOut(BaseModel):
    id: int
    title: str
    description: str
    created_at: str

    model_config = {"from_attributes": True}
