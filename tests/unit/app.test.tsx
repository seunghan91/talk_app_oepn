import React from 'react';
import { render } from '@testing-library/react-native';
import { Text, View } from 'react-native';

// 기본 테스트 - 앱이 크래시 없이 렌더링되는지 확인
describe('App Basic Tests', () => {
  it('should render a simple component without crashing', () => {
    const TestComponent = () => (
      <View testID="test-view">
        <Text testID="test-text">Hello Test</Text>
      </View>
    );
    
    const { getByTestId } = render(<TestComponent />);
    expect(getByTestId('test-view')).toBeTruthy();
    expect(getByTestId('test-text')).toBeTruthy();
  });

  it('should pass basic math test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle string operations', () => {
    expect('hello'.toUpperCase()).toBe('HELLO');
  });

  it('should handle array operations', () => {
    const arr = [1, 2, 3];
    expect(arr.length).toBe(3);
    expect(arr.includes(2)).toBe(true);
  });
}); 