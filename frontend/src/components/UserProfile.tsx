import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface UserProfileProps {
  onClose?: () => void;
}

export function UserProfile({ onClose }: UserProfileProps) {
  const { user, subscription, logout, startCheckout, refreshSubscription } = useAuth();

  const handleUpgrade = async () => {
    if (!subscription?.tiers?.premium?.priceId) return;
    await startCheckout(subscription.tiers.premium.priceId);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('subscription') === 'success') {
      refreshSubscription();
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [refreshSubscription]);

  if (!user) return null;

  const isPremium = user.subscriptionTier === 'premium';
  const premiumFeatures = subscription?.tiers?.premium?.features ?? ['Real-time predictions', 'Advanced analytics', 'Priority support'];
  const premiumPrice = subscription?.tiers?.premium?.price ?? 29;

  return (
    <div className="user-profile">
      <div className="profile-header">
        <h2>Account</h2>
        {onClose && (
          <button className="close-btn" onClick={onClose}>×</button>
        )}
      </div>

      <div className="profile-info">
        <div className="info-row">
          <span className="label">Email</span>
          <span className="value">{user.email}</span>
        </div>
        <div className="info-row">
          <span className="label">Member Since</span>
          <span className="value">{new Date(user.createdAt).toLocaleDateString()}</span>
        </div>
        <div className="info-row">
          <span className="label">Plan</span>
          <span className={`value tier-badge ${isPremium ? 'premium' : 'free'}`}>
            {isPremium ? 'Premium' : 'Free'}
          </span>
        </div>
      </div>

      {!isPremium && subscription && (
        <div className="upgrade-section">
          <h3>Upgrade to Premium</h3>
          <ul className="feature-list">
            {premiumFeatures.map((feature, i) => (
              <li key={i}>{feature}</li>
            ))}
          </ul>
          <button className="btn-primary upgrade-btn" onClick={handleUpgrade}>
            Upgrade for ${premiumPrice}/month
          </button>
        </div>
      )}

      <button className="btn-secondary logout-btn" onClick={logout}>
        Sign Out
      </button>
    </div>
  );
}
