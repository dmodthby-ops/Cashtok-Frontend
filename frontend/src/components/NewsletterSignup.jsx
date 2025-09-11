import React, { useState, useEffect } from 'react';
import { Mail, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import axios from 'axios';
import { useLocation } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LeadForm = ({ source = "unknown", variant = "default", className = "" }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Gestion du token de confirmation via query param
  const location = useLocation();
  const token = new URLSearchParams(location.search).get('token');

  useEffect(() => {
    if (!token) return;

    const confirmEmail = async () => {
      try {
        const res = await axios.get(`${API}/emails/confirm/${token}`);
        const subscriber = res.data;

        // Push GTM event
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: "email_confirmed",
          email: subscriber.email,
          source: subscriber.source,
          interests: subscriber.interests
        });

        setIsSubmitted(true);
      } catch (err) {
        console.error("Confirmation échouée", err);
        setError("Le lien de confirmation est invalide ou expiré.");
      }
    };

    confirmEmail();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      // 1. Crée lead + newsletter
      await axios.post(`${API}/leads`, {
        email: email.trim(),
        source,
        interests: ['tiktok', 'instagram', 'youtube'],
        interest_level: "high"
      });

      // 2. Push lead_submitted
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: "lead_submitted",
        email: email.trim(),
        source: source,
        interests: ['tiktok', 'instagram', 'youtube']
      });

      setIsSubmitted(true);
      setEmail('');

      // Track analytics
      try {
        await axios.post(`${API}/analytics/track`, {
          event_type: 'newsletter_signup',
          page: '/',
          section: source,
          additional_data: { source }
        });
      } catch (analyticsError) {
        console.log('Analytics tracking failed:', analyticsError);
      }

    } catch (error) {
      console.error('Lead form error:', error);
      if (error.response?.status === 422) {
        setError('Email invalide. Veuillez vérifier votre saisie.');
      } else {
        setError('Une erreur est survenue. Veuillez réessayer.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Message de succès (soumission ou confirmation)
  if (isSubmitted) {
    return (
      <div className={`bg-green-50 border border-green-200 rounded-2xl p-6 text-center ${className}`}>
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-green-800 mb-2">
          {token ? "Inscription confirmée !" : "Inscription réussie !"} 🎉
        </h3>
        <p className="text-green-700">
          Vous recevrez nos meilleures stratégies directement dans votre boîte mail.
        </p>
      </div>
    );
  }

  // ✅ Variante "hero"
  if (variant === "hero") {
    return (
      <div className={`bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50 ${className}`}>
        <div className="text-center mb-4">
          <Mail className="w-8 h-8 text-pink-500 mx-auto mb-2" />
          <h3 className="text-lg font-bold text-gray-900">
            Recevez nos stratégies secrètes
          </h3>
          <p className="text-gray-600 text-sm">
            Guide gratuit + conseils exclusifs chaque semaine
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            type="email"
            placeholder="Votre adresse email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="text-center"
          />
          
          {error && (
            <p className="text-red-600 text-sm text-center">{error}</p>
          )}

          <Button
            type="submit"
            disabled={isLoading || !email.trim()}
            className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold"
          >
            {isLoading ? 'Inscription...' : 'Recevoir le Guide Gratuit'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </form>

        <p className="text-xs text-gray-500 text-center mt-3">
          ✓ Pas de spam • ✓ Désabonnement en 1 clic
        </p>
      </div>
    );
  }

  // ✅ Variante par défaut
  return (
    <div className={`bg-gradient-to-r from-pink-50 to-blue-50 rounded-2xl p-6 border border-pink-200/50 ${className}`}>
      <div className="text-center mb-4">
        <Mail className="w-6 h-6 text-pink-500 mx-auto mb-2" />
        <h3 className="font-bold text-gray-900 text-lg">
          Newsletter CASHTOK
        </h3>
        <p className="text-gray-600 text-sm">
          Stratégies, astuces et actualités des réseaux sociaux
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex space-x-2">
        <Input
          type="email"
          placeholder="votre@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="flex-1"
        />
        
        <Button
          type="submit"
          disabled={isLoading || !email.trim()}
          className="bg-gradient-to-r from-pink-500 to-blue-500 hover:from-pink-600 hover:to-blue-600 whitespace-nowrap"
        >
          {isLoading ? '...' : 'S\'abonner'}
        </Button>
      </form>

      {error && (
        <p className="text-red-600 text-sm mt-2">{error}</p>
      )}

      <p className="text-xs text-gray-500 mt-3">
        Rejoignez 2 500+ créateurs qui reçoivent nos conseils premium
      </p>
    </div>
  );
};

export default LeadForm;
