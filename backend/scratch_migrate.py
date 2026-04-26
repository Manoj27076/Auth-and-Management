from app import create_app
from app.extensions import db
from sqlalchemy import text

app = create_app()

with app.app_context():
    try:
        db.session.execute(text("ALTER TABLE domains ADD COLUMN lead_id VARCHAR(36) NULL;"))
        db.session.execute(text("ALTER TABLE domains ADD CONSTRAINT fk_domains_lead_id FOREIGN KEY (lead_id) REFERENCES users(id) ON DELETE SET NULL;"))
        db.session.commit()
        print("Successfully added lead_id column to domains table.")
    except Exception as e:
        print(f"Migration failed or already applied: {e}")
