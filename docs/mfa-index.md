# MFA 문서 인덱스

이 문서 세트는 **Micro Frontend Architecture** 를 처음 접하는 사람부터, 실제 구조를 설계하려는 사람까지 순서대로 읽을 수 있도록 분리한 안내서입니다.

중요:

- 여기서 `MFA`는 **Multi-Factor Authentication** 이 아니라 **Micro Frontend Architecture** 를 뜻합니다.
- `cell` 이라는 표현은 업계 표준 용어라기보다, 실무에서 자주 쓰는 **vertical slice / 도메인 단위** 표현에 가깝습니다.
- single-spa 문맥의 `root-config` 는 종종 **UI 프레임워크가 없는 plain JS top-level router** 를 뜻하고, 일반적인 `shell/container` 와는 겹치는 부분이 있지만 완전히 같은 말은 아닙니다.

이 문서들은 single-spa, Martin Fowler, webpack Module Federation, MDN, Zustand, Pinia 공식 문서를 기준으로 기술적으로 다듬은 설명입니다.

## 읽기 순서

1. [mfa-overview.md](./mfa-overview.md)
   - MFA를 한 문장으로 이해하기
   - shell, root config, container, cell, app의 차이
   - 기본 구조와 역할
2. [mfa-boundaries.md](./mfa-boundaries.md)
   - 어디를 기준으로 나눌지
   - KYC를 셀로 볼지 앱으로 볼지
   - 처음 도입할 때 안전한 분해 기준
3. [mfa-composition.md](./mfa-composition.md)
   - 앱을 어떻게 조립할지
   - runtime composition, server-side composition, web components, iframe
   - Module Federation과 Import Maps 차이
   - same-origin 전략
4. [mfa-communication.md](./mfa-communication.md)
   - URL, shared module, API cache, 이벤트 기반 통신
   - global store를 왜 조심해야 하는지
   - 앱 간 통신 우선순위
5. [mfa-state-management.md](./mfa-state-management.md)
   - Zustand/Pinia를 MFA에서 안전하게 쓰는 방법
   - store 공유 대신 module 공유를 권하는 이유
   - React 셀과 Vue 셀을 함께 쓸 때의 패턴
6. [mfa-governance.md](./mfa-governance.md)
   - 디자인 시스템
   - 계약 관리, 테스트, 운영 복잡도
   - 언제 MFA를 하지 않는 게 맞는지

## 빠른 분류표

| 내가 궁금한 것 | 읽을 문서 |
| --- | --- |
| MFA가 정확히 뭔지 | [mfa-overview.md](./mfa-overview.md) |
| Shell과 Cell이 뭔지 | [mfa-overview.md](./mfa-overview.md) |
| KYC를 셀로 볼지 앱으로 볼지 | [mfa-boundaries.md](./mfa-boundaries.md) |
| 어떤 기준으로 쪼개야 하는지 | [mfa-boundaries.md](./mfa-boundaries.md) |
| Module Federation / Import Maps 차이 | [mfa-composition.md](./mfa-composition.md) |
| 같은 도메인 / 다른 도메인 전략 | [mfa-composition.md](./mfa-composition.md) |
| 앱 간 데이터 공유를 어떻게 할지 | [mfa-communication.md](./mfa-communication.md) |
| CustomEvent, BroadcastChannel, postMessage 차이 | [mfa-communication.md](./mfa-communication.md) |
| Zustand / Pinia를 어떻게 나눠야 하는지 | [mfa-state-management.md](./mfa-state-management.md) |
| 전역 store를 왜 조심해야 하는지 | [mfa-state-management.md](./mfa-state-management.md) |
| 운영에서 뭐가 어려운지 | [mfa-governance.md](./mfa-governance.md) |

## 한 문장 요약

**MFA의 본질은 "앱을 많이 연결하는 기술"이 아니라, "앱이 많이 연결되지 않아도 되게 경계를 설계하는 기술"입니다.**
