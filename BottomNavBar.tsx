import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

type NavItem = {
  key: string;
  label: string;
  icon: string;
};

type Props = {
  items: NavItem[];
  activeTab: string;
  onTabChange: (tab: string) => void;
};

export default function BottomNavBar({ items, activeTab, onTabChange }: Props) {
  return (
    <View style={styles.navBar}>
      <View style={styles.navContent}>
        {items.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              style={[styles.navItem, isActive && styles.navItemActive]}
              onPress={() => onTabChange(item.key)}
              activeOpacity={0.7}
            >
              <View style={[styles.itemWrapper, isActive && styles.itemWrapperActive]}>
                <Text style={[styles.label, isActive && styles.labelActive]}>
                  {item.label}
                </Text>
              </View>
              {isActive && <View style={styles.activePill} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  navBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#001e3c',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 0,
    paddingVertical: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 16,
  },
  navContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  navItemActive: {
    paddingVertical: 8,
  },
  itemWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  itemWrapperActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.4)',
  },
  label: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.4,
  },
  labelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  activePill: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3B82F6',
    marginTop: 6,
  },
});
