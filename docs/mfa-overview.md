# MFA 개요: 먼저 큰 그림부터 잡기

## 한 문장 정의

MFA는 **하나의 큰 프론트엔드를 여러 개의 독립적으로 개발·배포 가능한 프론트엔드 앱으로 나누고, 사용자에게는 하나의 제품처럼 보이게 만드는 구조** 입니다.

핵심은 단순히 화면을 나누는 것이 아니라, 아래 세 가지 경계를 함께 나누는 데 있습니다.

- 기능 경계
- 팀 책임 경계
- 배포 경계

## 먼저 용어를 정리하자

실무에서는 비슷한 말이 섞여서 쓰이기 때문에, 먼저 구분해두는 것이 좋습니다.

### Shell / Container

상위에서 앱들을 오케스트레이션하는 레이어입니다.

주요 책임:

- 공통 레이아웃
- 인증 진입점
- 상위 라우팅
- 네비게이션
- 에러 경계
- remote mount / unmount

### Root Config

single-spa 문맥에서는 보통 **top-level router 성격의 상위 구성 레이어** 를 의미합니다.

중요한 차이:

- 일반적인 shell/container는 UI 프레임워크를 가질 수도 있습니다.
- single-spa는 root-config를 가능한 한 **framework-less plain JS** 로 두는 쪽을 권장합니다.

즉, `shell` 과 `root-config` 는 겹치는 부분이 크지만 항상 완전히 같은 말은 아닙니다.

### Cell

`cell` 은 업계 표준 용어라기보다, 실무에서 자주 쓰는 **vertical slice** 표현에 가깝습니다.

쉽게 말하면:

- 하나의 비즈니스 흐름을 끝까지 책임지는 세로 단위
- 라우트, 화면, 로컬 상태, API 조합 로직, 배포 책임을 함께 가지는 단위

예:

- Catalog Cell
- Checkout Cell
- MyPage Cell
- KYC Cell

### App

MFA에서의 `app` 은 셀보다 더 독립적인 단위일 수도 있고, 셀과 거의 같은 뜻으로 쓰일 수도 있습니다. 그래서 문맥이 중요합니다.

실무에서는 보통 아래처럼 구분하면 편합니다.

- `cell`
  - 큰 서비스 내부의 도메인 단위
- `app`
  - 별도 실행, 별도 배포, 별도 제품 수준까지 포함하는 더 독립적인 단위

## 머릿속에 먼저 그려야 할 기본 구조

```text
Shell / Root Config
 ├─ 공통 레이아웃 (header, nav, footer)
 ├─ 공통 관심사 (auth, routing, error handling)
 ├─ Utility Modules
 │   ├─ @platform/auth
 │   ├─ @platform/api
 │   ├─ @platform/design-system
 │   └─ @platform/config
 ├─ Catalog Cell      (/products/**)
 ├─ Checkout Cell     (/checkout/**)
 └─ MyPage Cell       (/me/**)
```

이 그림에서 shell/root config가 하는 일은 "상위 오케스트레이션"입니다.

즉:

- 공통 헤더/푸터를 보여주고
- 인증 상태를 확인하고
- 현재 URL을 보고
- 어떤 앱을 mount 할지 결정합니다

## Shell은 무엇을 해야 하고, 무엇을 하면 안 되나

### Shell이 맡기 좋은 역할

- top-level routing
- auth 진입점
- navigation
- 공통 layout
- 공통 에러 처리
- remote 로딩

### Shell이 맡기 시작하면 위험한 역할

- 셀 내부 비즈니스 로직
- 셀 내부 UI 상태
- 셀 내부 플로우 제어
- 특정 도메인 API 분기 로직

왜냐하면 shell이 두꺼워질수록 micro frontend 분리의 의미가 줄어들기 때문입니다.

## Cell은 어떻게 이해하면 되나

Cell은 단순한 컴포넌트 묶음이 아닙니다.

좋은 cell은 보통 아래 성질을 가집니다.

- 라우트 경계가 있다
- 자기 DOM을 소유한다
- 자기 로컬 상태를 소유한다
- 자기 API 조합 로직을 가진다
- 팀 ownership이 붙기 쉽다

중요한 감각:

**"이 셀이 자기 DOM과 상태를 스스로 소유하는가?"**

이 기준이 흔들리면, cell은 독립 단위가 아니라 그냥 느슨한 폴더 분리 수준에 그치기 쉽습니다.

## KYC를 예시로 보면 왜 이해가 쉬운가

KYC는 보통 이런 흐름을 가집니다.

1. 인증 시작
2. 신분증 선택
3. 촬영
4. 검증
5. 추가 인증
6. 완료

즉 KYC는 "한 화면"이 아니라 **완결된 비즈니스 흐름** 입니다.

그래서 MFA에서 KYC는 보통 둘 중 하나로 설계됩니다.

- 서비스 내부의 KYC Cell
- 독립 배포되는 KYC App

이 둘의 차이는 [mfa-boundaries.md](./mfa-boundaries.md) 에서 자세히 다룹니다.

## 셀과 앱의 차이를 아주 짧게 요약하면

### Cell

- 큰 서비스 안의 작은 기능 앱
- 제품 경험 안에 자연스럽게 녹아 있음
- 상위 shell 아래에서 동작

### App

- 더 독립적인 실행/배포 단위
- 때로는 여러 서비스가 공통으로 사용
- 별도 시스템처럼 취급될 수 있음

## 한 문장 정리

**Shell은 "전체를 조립하는 레이어"이고, Cell은 "비즈니스 흐름을 끝까지 책임지는 세로 단위"입니다.**
