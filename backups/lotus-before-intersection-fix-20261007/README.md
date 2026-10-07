# 연꽃 관통 수정 전 백업

이 폴더에는 관통 수정 요청 직전의 파일을 그대로 보관했습니다.

- `intro-lotus.js`: 2초 개화, 120도 회전, 빠른 초반 가속, 연분홍 그라데이션
- `index.html`, `index.css`: 당시 페이지와 반응형 스타일
- `restore-lotus.ps1`: 연꽃 코드만 원래 위치에 복원하고 SHA256 일치를 확인

프로젝트 폴더에서 PowerShell로 실행합니다.

```powershell
& './backups/lotus-before-intersection-fix-20261007/restore-lotus.ps1'
```

스크립트 실행이 제한된 환경에서는 아래 명령으로 같은 파일을 복원할 수 있습니다.

```powershell
Copy-Item -LiteralPath './backups/lotus-before-intersection-fix-20261007/intro-lotus.js' -Destination './js/intro-lotus.js' -Force
```

복원 후 브라우저를 새로고침하세요. 이번 관통 수정은 `js/intro-lotus.js`만 변경했으므로 HTML과 CSS를 덮어쓸 필요는 없습니다. 이 백업은 Git 되돌리기 기능과 독립적으로 사용할 수 있습니다.
