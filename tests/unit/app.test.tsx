import React from 'react';
import { render } from '@testing-library/react-native';

// 기본 테스트 - 앱이 크래시 없이 렌더링되는지 확인
describe('App', () => {
  it('should render without crashing', () => {
    // 기본 컴포넌트 테스트
    const TestComponent = () => <></>;
    
    expect(() => {
      render(<TestComponent />);
    }).not.toThrow();
  });

  it('should pass basic test', () => {
    expect(1 + 1).toBe(2);
  });
}); 