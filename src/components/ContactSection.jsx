'use client';

import { useState } from 'react';
import { submitContactInquiry } from '../services/api';
import Reveal from './Reveal';

export default function ContactSection({ contact }) {
  const defaultStack = contact.stackOptions[0]?.value || '';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [stack, setStack] = useState(defaultStack);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [statusType, setStatusType] = useState('idle');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanMessage = message.trim();
    const chosenStack = stack || defaultStack;

    if (!cleanName || !cleanEmail || !cleanMessage) return;

    setSubmitting(true);
    setStatusType('sending');
    setFeedback('Enviando mensaje...');

    try {
      const result = await submitContactInquiry({
        name: cleanName,
        email: cleanEmail,
        stack: chosenStack,
        message: cleanMessage,
      });

      setStatusType('success');
      setFeedback(`✓ ${result.message || 'Mensaje enviado correctamente a mi correo.'}`);
      setName('');
      setEmail('');
      setMessage('');
    } catch (err) {
      setStatusType('error');
      setFeedback(
        err?.message
          ? `✗ ${err.message}`
          : '✗ No se pudo enviar el mensaje. Intenta nuevamente.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="portfolio-section section-contact" id="contacto" data-section="contacto">
      <div className="container">
        <Reveal as="header" className="section-head">
          <div className="section-eyebrow">
            <span className="eyebrow-index">04</span>
            <span className="eyebrow-sep">/</span>
            <span>Contacto</span>
          </div>
          <h2 className="section-title">
            Inicia una conversación técnica o estructura tu próximo proyecto.
          </h2>
        </Reveal>

        <Reveal as="div" className="contact-card glass-card" delay={1}>
          <div className="contact-info-col">
            <p className="body-paragraph">{contact.intro}</p>

            <ul className="contact-meta-list">
              <li>
                <span>Desarrollador</span>
                <strong>{contact.developer}</strong>
              </li>
              <li>
                <span>Perfil</span>
                <strong>{contact.profile}</strong>
              </li>
              <li>
                <span>GitHub</span>
                <a href={contact.githubUrl} target="_blank" rel="noopener noreferrer">
                  {contact.githubDisplay}
                </a>
              </li>
              <li>
                <span>Disponibilidad</span>
                <span className="status-inline">
                  <span className="ember-dot" /> {contact.availability}
                </span>
              </li>
            </ul>
          </div>

          <form className="contact-form" id="contact-form" onSubmit={handleSubmit}>
            <div className="form-row-2">
              <div className="field-wrap">
                <label htmlFor="input-name">Nombre o empresa</label>
                <input
                  type="text"
                  id="input-name"
                  className="field-input"
                  placeholder="Tu nombre o estudio"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="field-wrap">
                <label htmlFor="input-email">Tu correo</label>
                <input
                  type="email"
                  id="input-email"
                  className="field-input"
                  placeholder="tu@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="field-wrap">
              <label htmlFor="input-stack">Área principal</label>
              <select
                id="input-stack"
                className="field-input"
                value={stack || defaultStack}
                onChange={(e) => setStack(e.target.value)}
              >
                {contact.stackOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="field-wrap">
              <label htmlFor="input-message">Objetivo del proyecto</label>
              <textarea
                id="input-message"
                className="field-input"
                placeholder="Cuéntame sobre la plataforma, sistema o experiencia interactiva que quieres construir..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </div>

            <div className="form-footer">
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? 'Enviando...' : 'Enviar mensaje'}
              </button>
              <span
                className={`form-status${statusType === 'error' ? ' is-error' : ''}${
                  statusType === 'success' ? ' is-success' : ''
                }`}
                id="form-feedback"
                aria-live="polite"
              >
                {feedback}
              </span>
            </div>
          </form>
        </Reveal>
      </div>
    </section>
  );
}
