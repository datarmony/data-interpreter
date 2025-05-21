# -*- encoding: utf-8 -*-
"""
Copyright (c) 2019 - present AppSeed.us
"""

from flask import render_template, redirect, request, url_for, current_app
from flask_login import (
    current_user,
    login_user,
    logout_user
)

from flask_dance.contrib.github import github
from flask_dance.contrib.google import google

from apps import db, login_manager
from apps.authentication import blueprint
from apps.authentication.forms import LoginForm, CreateAccountForm, RegisterForm, CreateUserForm
from apps.authentication.models import Users
from apps.config import Config
from apps.authentication.util import verify_pass
import os


@blueprint.context_processor
def inject_debug_status():
    return dict(DEBUG=current_app.config.get('DEBUG', False))
    
@blueprint.route('/')
def route_default():
    return redirect(url_for('authentication_blueprint.login'))


# Login & Registration

@blueprint.route("/github")
def login_github():
    """ Github login """
    if not github.authorized:
        return redirect(url_for("github.login"))

    res = github.get("/user")
    return redirect(url_for('home_blueprint.index'))


@blueprint.route("/google")
def login_google():
    """ Google login """
    if not google.authorized:
        return redirect(url_for("google.login"))

    res = google.get("/oauth2/v1/userinfo")
    return redirect(url_for('home_blueprint.index'))


@blueprint.route('/login', methods=['GET', 'POST'])
def login():
    login_form = LoginForm(request.form)
    if 'login' in request.form:

        # read form data
        username = request.form['username']
        password = request.form['password']

        # Locate user
        user = Users.query.filter_by(username=username).first()

        # Check the password
        if user and verify_pass(password, user.password):

            login_user(user)
            return redirect(url_for('authentication_blueprint.route_default'))

        # Something (user or pass) is not ok
        return render_template('accounts/login.html',
                               msg='Wrong user or password',
                               form=login_form)

    if not current_user.is_authenticated:
        return render_template('accounts/login.html',
                               form=login_form)
    return redirect(url_for('home_blueprint.index'))


@blueprint.route('/admin/register', methods=['GET', 'POST'])
def admin_register():
    # Verificar si el usuario ya está autenticado
    if current_user.is_authenticated:
        return redirect(url_for('home_blueprint.index'))

    # Declarar el formulario
    form = RegisterForm(request.form)

    # Verificar si el formulario es válido
    if 'register' in request.form:
        
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']
        register_key = request.form['register_key']
        
        # Verificar la clave de registro
        admin_key = os.getenv('ADMIN_REGISTER_KEY')
        if not admin_key or register_key != admin_key:
            return render_template('admin/register.html',
                                   msg='Clave de registro incorrecta',
                                   success=False,
                                   form=form)
        
        # Verificar si el usuario ya existe
        user = Users.query.filter_by(username=username).first()
        if user:
            return render_template('admin/register.html',
                                   msg='El usuario ya existe',
                                   success=False,
                                   form=form)

        # Verificar si el email ya existe
        user = Users.query.filter_by(email=email).first()
        if user:
            return render_template('admin/register.html',
                                   msg='El correo electrónico ya existe',
                                   success=False,
                                   form=form)

        # Crear usuario con rol de administrador
        user = Users(username=username, email=email, password=password, is_admin=True)
        db.session.add(user)
        db.session.commit()

        # Redirigir a la página de inicio de sesión
        return render_template('admin/register.html',
                               msg='Administrador creado correctamente. <br> Por favor, inicia sesión.',
                               success=True,
                               form=form)

    else:
        return render_template('admin/register.html', form=form)


@blueprint.route('/logout')
def logout():
    logout_user()
    return redirect(url_for('authentication_blueprint.login'))


# Errors

@blueprint.context_processor
def has_github():
    return {'has_github': bool(Config.GITHUB_ID) and bool(Config.GITHUB_SECRET)}

@blueprint.context_processor
def has_google():
    return {'has_google': bool(Config.GOOGLE_ID) and bool(Config.GOOGLE_SECRET)}

@login_manager.unauthorized_handler
def unauthorized_handler():
    return render_template('pages/page-403.html'), 403


@blueprint.errorhandler(403)
def access_forbidden(error):
    return render_template('pages/page-403.html'), 403


@blueprint.errorhandler(404)
def not_found_error(error):
    return render_template('pages/page-404.html'), 404


@blueprint.errorhandler(500)
def internal_error(error):
    return render_template('pages/page-500.html'), 500

@blueprint.route('/admin/create-user', methods=['GET', 'POST'])
def admin_create_user():
    # Verificar si el usuario está autenticado y es administrador
    if not current_user.is_authenticated or not current_user.is_admin:
        return render_template('pages/page-403.html'), 403

    # Crear el formulario
    form = CreateUserForm(request.form)
    
    # Verificar si el formulario es válido
    if request.method == 'POST' and 'register' in request.form:
        # Obtener los datos del formulario
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']
        
        # Verificar si el usuario ya existe
        user = Users.query.filter_by(username=username).first()
        if user:
            return render_template('admin/create_user.html',
                                   msg='El usuario ya existe',
                                   success=False,
                                   form=form)
        # Verificar si el email ya existe
        user = Users.query.filter_by(email=email).first()
        if user:
            return render_template('admin/create_user.html',
                                   msg='El correo electrónico ya existe',
                                   success=False,
                                   form=form)
        
        try:
            # Crear el usuario (siempre como no administrador)
            user = Users(username=username, email=email, password=password, is_admin=False)
            db.session.add(user)
            db.session.commit()
            
            # Después de crear el usuario exitosamente, redirigir a la misma página
            # para forzar una recarga completa y limpiar el formulario
            return redirect(url_for('authentication_blueprint.admin_create_user', 
                                    success=True, 
                                    msg='Usuario creado correctamente'))
        except Exception as e:
            # Capturar cualquier error durante la creación
            db.session.rollback()
            return render_template('admin/create_user.html',
                                   msg=f'Error al crear usuario: {str(e)}',
                                   success=False,
                                   form=form)
    
    # Verificar si hay mensajes en la URL (después de redirección)
    success = request.args.get('success', 'False') == 'True'
    msg = request.args.get('msg', None)
    
    # Renderizar la plantilla con el formulario
    return render_template('admin/create_user.html', 
                          form=CreateUserForm(),  # Siempre un formulario nuevo y vacío
                          success=success, 
                          msg=msg)
    