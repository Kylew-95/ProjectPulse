import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { BottomSheetModal, BottomSheetScrollView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import * as WebBrowser from 'expo-web-browser';
import { X, Check, Rocket, ExternalLink } from 'lucide-react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getApiUrl } from '@/utils/apiConfig';
import { useAuth } from '@/context/AuthContext';

interface SubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  currentPlan?: string;
}

interface ModalPlan {
  name: string;
  price: string;
  period: string;
  features: string[];
  active: boolean;
  priceId: string;
  isEnterprise: boolean;
}

interface StripeProduct {
  id: string;
  name: string;
  price: number;
  price_id: string;
  description: string | null;
  metadata?: {
    plan_tier_id?: string;
    features?: string;
  };
}

export default function SubscriptionModal({ visible, onClose }: SubscriptionModalProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme as keyof typeof Colors];
  const { user, profile, refreshProfile } = useAuth();
  
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['75%', '90%'], []);

  const [plans, setPlans] = useState<ModalPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingPlans, setFetchingPlans] = useState(false);

  const fetchPlans = useCallback(async () => {
    setFetchingPlans(true);
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/products`);
      if (res.ok) {
        const data: StripeProduct[] = await res.json();
        const formatted: ModalPlan[] = data.sort((a, b) => a.price - b.price).map((p) => ({
          name: p.name,
          price: `£${Math.floor(p.price)}`,
          period: '/mo',
          features: p.metadata?.features ? p.metadata.features.split(',').map(f => f.trim()) : [],
          active: profile?.subscription_tier === p.metadata?.plan_tier_id || (p.name === 'Starter' && !profile?.subscription_tier),
          priceId: p.price_id,
          isEnterprise: p.name === 'Enterprise'
        }));
        setPlans(formatted);
      } else {
          console.error('[SubscriptionModal] Failed to fetch plans:', res.status);
      }
    } catch (e) {
      console.error("[SubscriptionModal] Failed to fetch plans exception", e);
      Alert.alert('Error', 'Failed to load subscription plans. Please try again later.');
    } finally {
      setFetchingPlans(false);
    }
  }, [profile]);

  useEffect(() => {
    if (visible) {
      bottomSheetModalRef.current?.present();
      fetchPlans();
    } else {
      bottomSheetModalRef.current?.dismiss();
    }
  }, [visible, fetchPlans]);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      onClose();
    }
  }, [onClose]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  const handleSubscribe = async (priceId: string) => {
    setLoading(true);
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price_id: priceId,
          user_id: user?.id,
          email: user?.email
        }),
      });
      const data = await response.json();
      if (data.url) {
        await WebBrowser.openBrowserAsync(data.url, {
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
          controlsColor: colors.tint,
        });
        await refreshProfile();
        // Close modal after returning from browser? Maybe not, keep it open to check status.
      } else {
         Alert.alert('Error', 'Could not initiate checkout.');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      Alert.alert('Error', 'Something went wrong starting the checkout.');
    } finally {
        setLoading(false);
    }
  };

  const handlePortal = async () => {
    setLoading(true);
      try {
        const apiUrl = getApiUrl();
        const response = await fetch(`${apiUrl}/create-portal-session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user?.email
          }),
        });
        const data = await response.json();
        if (data.url) {
           await WebBrowser.openBrowserAsync(data.url);
           await refreshProfile();
        }
      } catch (err) {
        console.error('Portal error:', err);
        Alert.alert('Error', 'Could not open billing portal.');
      } finally {
          setLoading(false);
      }
  };





  // const isSuperAdmin = profile?.subscription_tier === 'super_admin';
  // const isSuperAdmin = profile?.subscription_tier === 'super_admin';
  const isSuperAdmin = false; // TEMPORARY: Allow testing as regular user even if super admin

  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      index={0}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: colors.surface, borderRadius: 24 }}
      handleIndicatorStyle={{ backgroundColor: colors.icon }}
    >
      <BottomSheetScrollView contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Manage Subscription</Text>
            <Text style={[styles.subtitle, { color: colors.icon }]}>
              {isSuperAdmin ? 'Super Admin Access' : 'Upgrade to unlock more features'}
            </Text>
          </View>
          <TouchableOpacity onPress={() => onClose()} style={styles.closeButton}>
            <X size={24} color={colors.icon} />
          </TouchableOpacity>
        </View>

        {isSuperAdmin && (
          <View style={[styles.superAdminBanner, { backgroundColor: '#8b5cf620', borderColor: '#8b5cf6' }]}>
            <Rocket size={24} color="#8b5cf6" />
            <View style={styles.superAdminContent}>
              <Text style={[styles.superAdminTitle, { color: '#8b5cf6' }]}>Super Admin</Text>
              <Text style={[styles.superAdminDesc, { color: colors.text }]}>
                You have full access to all features across all tiers.
              </Text>
            </View>
          </View>
        )}

        {/* Loading State */}
        {fetchingPlans && (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={colors.tint} />
            </View>
        )}

        {/* Plans */}
        {!fetchingPlans && (
        <View style={styles.plansContainer}>
          {plans.map((plan) => {
            const isCurrent = plan.active || (plan.name === 'Starter' && !profile?.subscription_tier);
            const isHighlight = plan.name === 'Pro';

            return (
              <TouchableOpacity 
                key={plan.name} 
                style={[
                  styles.planCard, 
                  { 
                    backgroundColor: colors.surface,
                    borderColor: isCurrent ? colors.tint : (isHighlight ? colors.tint + '40' : colors.tabIconDefault + '40'),
                    borderWidth: isCurrent || isHighlight ? 2 : 1,
                  }
                ]}
                onPress={() => handleSubscribe(plan.priceId)}
                disabled={isCurrent || loading}
                activeOpacity={0.7}
              >
                <View style={styles.planHeader}>
                  <View>
                    <Text style={[styles.planName, { color: colors.text }]}>{plan.name}</Text>
                    <View style={{flexDirection: 'row', alignItems: 'baseline'}}>
                        <Text style={[styles.planPrice, { color: colors.tint }]}>{plan.price}</Text>
                        <Text style={[styles.planPeriod, { color: colors.icon }]}>{plan.period}</Text>
                    </View>
                  </View>
                  {isCurrent && (
                    <View style={[styles.badge, { backgroundColor: colors.tint + '20' }]}>
                      <Text style={[styles.badgeText, { color: colors.tint }]}>Current</Text>
                    </View>
                  )}
                  {isHighlight && !isCurrent && (
                    <View style={[styles.badge, { backgroundColor: '#8b5cf620' }]}>
                      <Text style={[styles.badgeText, { color: '#8b5cf6' }]}>Best Value</Text>
                    </View>
                  )}
                </View>

                <View style={styles.featuresList}>
                  {plan.features.slice(0, 3).map((feature, i) => (
                    <View key={i} style={styles.featureItem}>
                      <Check size={16} color={colors.tint} />
                      <Text style={[styles.featureText, { color: colors.text }]}>{feature}</Text>
                    </View>
                  ))}
                  {plan.features.length > 3 && (
                      <Text style={[styles.featureText, { color: colors.icon, marginLeft: 24, fontStyle: 'italic', fontSize: 12 }]}>+ more</Text>
                  )}
                </View>

                {(!isCurrent) && (
                  <View 
                    style={[
                      styles.actionButton, 
                      { backgroundColor: isHighlight ? colors.tint : colors.surface, 
                        borderColor: colors.tint,
                        borderWidth: isHighlight ? 0 : 1,
                        opacity: loading ? 0.7 : 1
                      }
                    ]}
                  >
                     {loading ? (
                         <ActivityIndicator size="small" color={isHighlight ? '#fff' : colors.tint} />
                     ) : (
                        <Text style={[
                        styles.actionButtonText, 
                        { color: isHighlight ? '#fff' : colors.tint }
                        ]}>
                        Upgrade
                        </Text>
                     )}
                  </View>
                )}
                 
                 {isCurrent && !isSuperAdmin && plan.name !== 'Starter' && (
                     <View style={styles.currentPlanContainer}>
                        <Text style={[styles.currentPlanText, {color: colors.icon}]}>Your current plan</Text>
                     </View>
                 )}
              </TouchableOpacity>
            );
          })}
        </View>
        )}

        {/* Action Buttons */}
        {!fetchingPlans && (
            <View style={styles.footerActions}>
                <TouchableOpacity 
                    style={[styles.portalButton, { borderColor: colors.tabIconDefault + '40' }]}
                    onPress={handlePortal}
                >
                    <Text style={[styles.portalButtonText, { color: colors.text }]}>Manage Billing Settings</Text>
                    <ExternalLink size={16} color={colors.icon} />
                </TouchableOpacity>
            </View>
        )}
        
        {/* Padding for bottom safe area */}
        <View style={{ height: 40 }} />
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    padding: 20,
  },
  centerContainer: {
      padding: 40,
      alignItems: 'center',
      justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  closeButton: {
    padding: 4,
  },
  plansContainer: {
    gap: 16,
  },
  planCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  planName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 18,
    fontWeight: '600',
  },
  planPeriod: {
      fontSize: 14,
      marginLeft: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  featuresList: {
    gap: 8,
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 14,
  },
  actionButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  superAdminBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
    gap: 16,
  },
  superAdminContent: {
    flex: 1,
  },
  superAdminTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  superAdminDesc: {
    fontSize: 14,
  },
  portalButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      gap: 8,
  },
  portalButtonText: {
      fontSize: 16,
      fontWeight: '600',
  },
  currentPlanContainer: {
      alignItems: 'center',
      marginTop: 8,
  },
  currentPlanText: {
      fontSize: 14,
  },
  footerActions: {
      marginTop: 24,
      gap: 12,
  },
  cancelButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
  },
  cancelButtonText: {
      fontSize: 16,
      fontWeight: '600',
  }
});
