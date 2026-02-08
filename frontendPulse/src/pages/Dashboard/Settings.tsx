import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/common/PageHeader';
import SubscriptionSection from '../../components/settings/SubscriptionSection';
import IntegrationsSection from '../../components/settings/IntegrationsSection';
import AccountSection from '../../components/settings/AccountSection';
import SubscriptionModal from '../../components/settings/SubscriptionModal';
import AuditLogViewer from '../../components/settings/AuditLogViewer';


const Settings = () => {
  const { user, profile } = useAuth();
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto relative">
      <PageHeader title="Settings" className="mb-8" />

      <SubscriptionSection 
        profile={profile} 
        onManageClick={() => setShowSubscriptionModal(true)} 
      />

      <div className="mb-6">
        <IntegrationsSection profile={profile} />
      </div>
      
      <div className="mb-6">
        <AccountSection user={user} profile={profile} />
      </div>
      
      <div className="mt-8 border-t border-slate-100 dark:border-white/5 pt-8">
        <AuditLogViewer />
      </div>

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
