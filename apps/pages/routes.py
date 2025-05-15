# -*- encoding: utf-8 -*-
"""
Copyright (c) 2019 - present AppSeed.us
"""

import base64
import os
import uuid
from apps.pages import blueprint
from flask import render_template, request, current_app, redirect, url_for, flash
from flask_login import login_required, current_user
from jinja2 import TemplateNotFound
from apps.models import Dashboard
from flask import jsonify
from flask_login import current_user
from apps import db
from apps.gemini_analyzer import analyze_image_with_gemini
import datetime
import markdown

@blueprint.context_processor
def inject_debug_status():
    return dict(DEBUG=current_app.config.get('DEBUG', False))
 
@blueprint.route('/index')
@login_required
def index():
    return render_template('pages/index.html', segment='index')

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
    dashboard = Dashboard.query.filter_by(id=dashboard_id, user_id=current_user.id).first()

    if not dashboard:
        return jsonify(success=False, message="Dashboard not found or access denied."), 404

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


@blueprint.route('/api/upload_screenshot', methods=['POST'])
@login_required
def upload_screenshot():
    """API endpoint to receive screenshot data from the extension."""
    if not request.is_json:
        return jsonify(success=False, message="Request must be JSON"), 400

    data = request.get_json()
    if not data or 'image_data' not in data:
        return jsonify(success=False, message="Missing 'image_data' in request body"), 400

    image_data_base64 = data['image_data']
    current_app.logger.info(f"Received screenshot for user {current_user.id}. Length: {len(image_data_base64)}")
 
    try:
        # Define the upload folder path
        upload_folder = os.path.join(current_app.root_path, 'static', 'uploads', 'screenshots')
        
        # Create the directory if it doesn't exist
        os.makedirs(upload_folder, exist_ok=True)

        # Decode the base64 string
        try:
            image_data_bytes = base64.b64decode(image_data_base64)
        except base64.binascii.Error as e:
            print(f"Error decoding base64 string: {e}")
            return jsonify(success=False, message="Invalid base64 image data."), 400

        # Generate a unique filename
        filename = f"screenshot_{current_user.id}_{uuid.uuid4().hex}.png"
        filepath = os.path.join(upload_folder, filename)

        # Save the image
        with open(filepath, 'wb') as f:
            f.write(image_data_bytes)
        
        print(f"Screenshot saved to {filepath}")
        
        # Construct the URL to access the image
        image_url = f"/static/uploads/screenshots/{filename}"
        
        # Analyze the image with Gemini
        current_app.logger.info(f"Starting Gemini analysis for {filepath}")
        analysis_text = analyze_image_with_gemini(filepath)
        current_app.logger.info(f"Gemini analysis result: {analysis_text[:200]}...")

        # Return both original Markdown and converted HTML
        if "Error:" not in analysis_text:
             current_app.logger.info(f"Successfully generated Gemini analysis for user {current_user.id}. Converting to HTML.")
             analysis_html = markdown.markdown(analysis_text, extensions=['extra', 'nl2br'])
             return jsonify(success=True,
                           message="Screenshot processed and analysis generated.",
                           image_url=image_url,
                           gemini_analysis_html=analysis_html, # Send HTML for display
                           gemini_analysis_md=analysis_text), 200 # Send MD for download
        else:
             # Analysis failed - send the error message back (no HTML conversion needed)
             current_app.logger.error(f"Gemini analysis failed for user {current_user.id}: {analysis_text}")
             return jsonify(success=False,
                           message=f"Screenshot saved, but Gemini analysis failed.",
                           gemini_analysis_html=f"<p class='text-danger'>Error: {analysis_text}</p>", # Basic error HTML
                           gemini_analysis_md=analysis_text, # Send the error text back as MD too
                           image_url=image_url), 200 # Return 200 OK but indicate failure in payload

    except Exception as e:
        current_app.logger.error(f"Error in upload_screenshot route for user {current_user.id}: {e}", exc_info=True)
        # Log the full traceback for debugging
        import traceback
        traceback.print_exc()
        return jsonify(success=False, message=f"An internal error occurred while saving the screenshot: {str(e)}"), 500

@blueprint.route('/extension-required')
@login_required
def extension_required():
    return render_template('pages/extension-required.html')


@blueprint.route('/dashboard/<int:dashboard_id>/delete', methods=['POST'])
@login_required
def delete_dashboard(dashboard_id):
    dashboard = Dashboard.query.filter_by(id=dashboard_id, user_id=current_user.id).first_or_404()
    try:
        dashboard.delete()
        return jsonify(success=True, message="Dashboard eliminado exitosamente"), 200
    except Exception as e:
        return jsonify(success=False, message=str(e)), 500



@blueprint.route('/dashboard/<int:dashboard_id>/edit', methods=['GET', 'POST'])
@login_required
def edit_dashboard(dashboard_id):
    dashboard = Dashboard.query.filter_by(id=dashboard_id, user_id=current_user.id).first_or_404()
    
    if request.method == 'POST':
        name = request.form.get('name')
        share_link = request.form.get('share_link')
        reset_height = request.form.get('reset_height') == 'true'
        
        if name:
            dashboard.name = name
        if share_link:
            dashboard.share_link = share_link
            dashboard.embed_link = dashboard.generate_embed_link(share_link)
        if reset_height:
            dashboard.height = None
            
        try:
            db.session.commit()
            flash('Dashboard actualizado exitosamente', 'success')
            return redirect(url_for('home_blueprint.view_dashboard', dashboard_id=dashboard_id))
        except Exception as e:
            db.session.rollback()
            flash('Error al actualizar el dashboard: ' + str(e), 'error')
            
    return render_template('pages/edit-dashboard.html', dashboard=dashboard, segment='dashboards')