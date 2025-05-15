# -*- encoding: utf-8 -*-

from apps import db
from sqlalchemy.exc import SQLAlchemyError
from apps.exceptions.exception import InvalidUsage
import datetime as dt
import re

class Dashboard(db.Model):
    __tablename__ = "dashboards"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    share_link = db.Column(db.String(255), nullable=False)
    embed_link = db.Column(db.String(255), nullable=False)
    height = db.Column(db.Integer, nullable=True, default=None)
    
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)  # NEW
    user = db.relationship("Users", backref="dashboards")  # Optional reverse access
 
    def __init__(self, name, share_link, user_id, embed_link=None, height=None):
        self.name = name
        self.share_link = share_link
        self.embed_link = embed_link or self.generate_embed_link(share_link)
        self.user_id = user_id
        self.height = height # Added height
 
    def generate_embed_link(self, share_link):
        return re.sub(r"/u/\d+/reporting", "/embed/reporting", share_link)

    def save(self):
        db.session.add(self)
        db.session.commit()

    def delete(self):
        db.session.delete(self)
        db.session.commit()