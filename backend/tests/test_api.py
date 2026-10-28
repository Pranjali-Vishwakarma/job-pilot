from fastapi.testclient import TestClient

PROJECT = {
    "kind": "project",
    "title": "  Visual RAG for image search  ",
    "role": "ML engineer",
    "start_date": "2026-06",
    "end_date": "2026-08",
    "bullets": ["Built a CLIP retrieval pipeline", "  ", "Reached 0.82 recall@10"],
    "tags": ["RAG", "rag", "Computer Vision"],
    "tech": ["Python", "FastAPI", "python"],
}


def test_health(client: TestClient) -> None:
    assert client.get("/api/health").json() == {"status": "ok"}


def test_profile_starts_empty_and_updates(client: TestClient) -> None:
    assert client.get("/api/profile").json()["full_name"] == ""
    response = client.put("/api/profile", json={"full_name": "Test User", "location": "Pune"})
    assert response.status_code == 200
    assert response.json()["full_name"] == "Test User"
    assert client.get("/api/profile").json()["location"] == "Pune"


def test_create_item_cleans_lists(client: TestClient) -> None:
    response = client.post("/api/items", json=PROJECT)
    assert response.status_code == 201
    item = response.json()
    assert item["title"] == "Visual RAG for image search"
    assert item["bullets"] == ["Built a CLIP retrieval pipeline", "Reached 0.82 recall@10"]
    assert item["tags"] == ["RAG", "Computer Vision"]
    assert item["tech"] == ["Python", "FastAPI"]


def test_item_validation(client: TestClient) -> None:
    bad_date = {**PROJECT, "start_date": "06/2026"}
    assert client.post("/api/items", json=bad_date).status_code == 422
    wrong_order = {**PROJECT, "start_date": "2026-08", "end_date": "2026-06"}
    assert client.post("/api/items", json=wrong_order).status_code == 422
    ongoing_with_end = {**PROJECT, "is_current": True}
    assert client.post("/api/items", json=ongoing_with_end).status_code == 422
    assert client.post("/api/items", json={**PROJECT, "title": "   "}).status_code == 422


def test_update_and_delete_item(client: TestClient) -> None:
    item_id = client.post("/api/items", json=PROJECT).json()["id"]

    response = client.patch(f"/api/items/{item_id}", json={"is_current": True, "tags": ["LLM"]})
    assert response.status_code == 200
    assert response.json()["end_date"] is None
    assert response.json()["tags"] == ["LLM"]
    assert response.json()["title"] == "Visual RAG for image search"  # untouched

    bad = client.patch(f"/api/items/{item_id}", json={"is_current": False, "end_date": "2020-01"})
    assert bad.status_code == 422

    assert client.delete(f"/api/items/{item_id}").status_code == 204
    assert client.get(f"/api/items/{item_id}").status_code == 404


def test_list_items_filters_and_sorts(client: TestClient) -> None:
    client.post(
        "/api/items", json={**PROJECT, "title": "Older", "start_date": "2024-01", "end_date": "2024-03"}
    )
    client.post("/api/items", json={**PROJECT, "title": "Newer"})
    client.post(
        "/api/items",
        json={"kind": "experience", "title": "Intern", "start_date": "2026-01", "is_current": True},
    )

    projects = client.get("/api/items", params={"kind": "project"}).json()
    assert [p["title"] for p in projects] == ["Newer", "Older"]
    everything = client.get("/api/items").json()
    assert everything[0]["title"] == "Intern"  # ongoing items come first


def test_skills_are_unique_case_insensitive(client: TestClient) -> None:
    created = client.post("/api/skills", json={"name": "Python", "category": "language", "level": "advanced"})
    assert created.status_code == 201
    assert client.post("/api/skills", json={"name": " python "}).status_code == 409

    other = client.post("/api/skills", json={"name": "Docker", "category": "cloud_devops"}).json()
    assert client.patch(f"/api/skills/{other['id']}", json={"name": "PYTHON"}).status_code == 409
    renamed = client.patch(f"/api/skills/{other['id']}", json={"name": "Docker Compose", "level": "beginner"})
    assert renamed.json()["level"] == "beginner"

    assert [s["name"] for s in client.get("/api/skills").json()] == ["Docker Compose", "Python"]
    assert client.delete(f"/api/skills/{other['id']}").status_code == 204


def test_export_import_round_trip(client: TestClient) -> None:
    client.put("/api/profile", json={"full_name": "Test User"})
    client.post("/api/items", json=PROJECT)
    client.post("/api/skills", json={"name": "Python", "category": "language"})

    bundle = client.get("/api/export").json()
    assert bundle["profile"]["full_name"] == "Test User"
    assert len(bundle["items"]) == 1 and len(bundle["skills"]) == 1

    client.put("/api/profile", json={"full_name": "Changed"})
    client.post("/api/skills", json={"name": "Rust"})

    result = client.post("/api/import", json=bundle)
    assert result.json() == {"items": 1, "skills": 1}
    assert client.get("/api/profile").json()["full_name"] == "Test User"
    assert [s["name"] for s in client.get("/api/skills").json()] == ["Python"]


def test_import_rejects_duplicate_skills(client: TestClient) -> None:
    bundle = {"skills": [{"name": "Python"}, {"name": "python"}]}
    assert client.post("/api/import", json=bundle).status_code == 422
