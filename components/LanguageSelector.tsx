import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { saveLanguage } from '../app/i18n';

interface Language {
  code: string;
  name: string;
  flag: string;
}

const LANGUAGES: Language[] = [
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' }
];

const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();

  const changeLanguage = async (langCode: string): Promise<void> => {
    try {
      await i18n.changeLanguage(langCode);
      await saveLanguage(langCode);
    } catch (error) {
      console.error('언어 변경 실패:', error);
    }
  };

  return (
    <View style={styles.container}>
      {LANGUAGES.map((lang) => (
        <TouchableOpacity
          key={lang.code}
          style={[
            styles.languageButton,
            i18n.language === lang.code && styles.activeLanguage
          ]}
          onPress={() => changeLanguage(lang.code)}
        >
          <Text style={styles.flagText}>{lang.flag}</Text>
          <Text style={[
            styles.languageText,
            i18n.language === lang.code && styles.activeLanguageText
          ]}>
            {lang.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  activeLanguage: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  flagText: {
    fontSize: 16,
    marginRight: 5,
  },
  languageText: {
    fontSize: 14,
    color: '#333',
  },
  activeLanguageText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default LanguageSelector; 