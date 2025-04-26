# -*- encoding: utf-8 -*-
"""
Copyright (c) 2019 - present AppSeed.us
"""

from apps.pages import blueprint
from flask import render_template, request
from flask_login import login_required
from jinja2 import TemplateNotFound
from apps.models import Dashboard
from flask import jsonify
from flask_login import current_user
from apps import db


@blueprint.route('/index')
@login_required
def index():
    return render_template('pages/index.html', segment='index')

@blueprint.route('/typography')
@login_required
def typography():
    return render_template('pages/typography.html')

@blueprint.route('/color')
@login_required
def color():
    return render_template('pages/color.html')

@blueprint.route('/icon-tabler')
@login_required
def icon_tabler():
    return render_template('pages/icon-tabler.html')

@blueprint.route('/sample-page')
@login_required
def sample_page():
    return render_template('pages/sample-page.html')  

@blueprint.route('/accounts/password-reset/')
def password_reset():
    return render_template('accounts/password_reset.html')

@blueprint.route('/accounts/password-reset-done/')
def password_reset_done():
    return render_template('accounts/password_reset_done.html')

@blueprint.route('/accounts/password-reset-confirm/')
def password_reset_confirm():
    return render_template('accounts/password_reset_confirm.html')

@blueprint.route('/accounts/password-reset-complete/')
def password_reset_complete():
    return render_template('accounts/password_reset_complete.html')

@blueprint.route('/accounts/password-change/')
def password_change():
    return render_template('accounts/password_change.html')

@blueprint.route('/accounts/password-change-done/')
def password_change_done():
    return render_template('accounts/password_change_done.html')

@blueprint.route("/create-dashboard", methods=["POST"])
def create_dashboard():
    name = request.form.get("name")
    share_link = request.form.get("share_link")

    new_dashboard = Dashboard(
        name=name,
        share_link=share_link,
        user_id=current_user.id
    )
    
    db.session.add(new_dashboard)
    db.session.commit()
    
    return jsonify(success=True, message="Dashboard created"), 201

@blueprint.route('/dashboard/<int:dashboard_id>', methods=['GET'])
@login_required
def view_dashboard(dashboard_id):
    dashboard = Dashboard.query.filter_by(id=dashboard_id, user_id=current_user.id).first_or_404()
    return render_template('pages/view-dashboard.html', dashboard=dashboard,  dashboard_id=dashboard_id, segment='dashboards')

@blueprint.route('/api/dashboard/<int:dashboard_id>/set-height', methods=['POST'])
@login_required
def set_dashboard_height(dashboard_id):
    """API endpoint to set the height for a specific dashboard."""
    dashboard = Dashboard.query.filter_by(id=dashboard_id, user_id=current_user.id).first()

    if not dashboard:
        return jsonify(success=False, message="Dashboard not found or access denied."), 404

    # Prevent changing height if already set
    if dashboard.height is not None:
         return jsonify(success=False, message="Dashboard height is already set and cannot be changed."), 400

    data = request.get_json()
    if not data or 'height' not in data:
        return jsonify(success=False, message="Missing 'height' in request body."), 400

    try:
        height = int(data['height'])
        if height <= 0:
             raise ValueError("Height must be a positive integer.")
    except (ValueError, TypeError):
        return jsonify(success=False, message="Invalid height value. Must be a positive integer."), 400

    try:
        dashboard.height = height
        db.session.commit()
        return jsonify(success=True, message=f"Dashboard height set to {height}px."), 200
    except Exception as e:
        db.session.rollback()
        print(f"Error saving dashboard height: {e}") # Log the error server-side
        return jsonify(success=False, message="An internal error occurred while saving the height."), 500
