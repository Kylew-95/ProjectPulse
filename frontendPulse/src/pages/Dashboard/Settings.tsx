import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/common/PageHeader';
import SubscriptionSection from '../../components/settings/SubscriptionSection';
import IntegrationsSection from '../../components/settings/IntegrationsSection';
import AccountSection from '../../components/settings/AccountSection';
import SubscriptionModal from '../../components/settings/SubscriptionModal';


const Settings = () => {
  const { user, profile } = useAuth();
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  return (
    <div className="p-8 max-w-4xl mx-auto relative">
      <PageHeader title="Settings" className="mb-8" />

      <SubscriptionSection 
        profile={profile} 
        onManageClick={() => setShowSubscriptionModal(true)} 
      />

      <IntegrationsSection />

      <AccountSection user={user} profile={profile} />

      {/* Subscription Modal */}
      <SubscriptionModal 
        isOpen={showSubscriptionModal} 
        onClose={() => setShowSubscriptionModal(false)} 
        user={user}
        profile={profile}
      />
    </div>
  );
};

export default Settings;
