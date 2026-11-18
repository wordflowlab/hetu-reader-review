# 试读工作台功能清单

本包拥有专业能力；宿主拥有正文、来源与作者决定。

| 动作 | 用途 | 必填参数 | 效果 |
| --- | --- | --- | --- |
| list_projects | 查找专业工程 |  | read |
| get_project | 读取固定专业工程 | object_id | read |
| save_project | 保存完整专业工程 | expected_revision, expected_sha256, operation_key, content | managed_write |
| put_packet | 维护试读版本 | object_id, expected_revision, expected_sha256, operation_key, packet | managed_write |
| remove_packet | 移除试读版本 | object_id, expected_revision, expected_sha256, operation_key, packet_id | managed_write |
| put_reader | 维护读者 | object_id, expected_revision, expected_sha256, operation_key, reader | managed_write |
| remove_reader | 移除读者 | object_id, expected_revision, expected_sha256, operation_key, reader_id | managed_write |
| put_submission | 维护反馈提交 | object_id, expected_revision, expected_sha256, operation_key, submission | managed_write |
| put_decision | 维护处理决定 | object_id, expected_revision, expected_sha256, operation_key, decision | managed_write |
| remove_decision | 移除处理决定 | object_id, expected_revision, expected_sha256, operation_key, decision_id | managed_write |
| check_feedback | 检查覆盖与分歧 | object_id | read |
| export_packet | 导出离线试读包 | object_id, packet_id | read |
| preview_feedback | 预览反馈文件 | object_id, file | read |
| import_feedback | 导入固定反馈 | object_id, expected_revision, expected_sha256, operation_key, file | managed_write |
| packet_digest | 读取固定试读包摘要 | object_id, packet_id | read |
| get_source | 读取固定来源 | object_id, source_index | read |
| get_basis | 读取固定专业依据 | object_id, basis_index | read |
| compare_versions | 比较固定修订 | object_id, from_revision, to_revision | read |
| export_project | 导出固定专业报告 | object_id, format | read |
| build_context | 准备有界创作上下文 | object_id, goal, max_chars | read |
| create_handoff | 准备精确AI交接 | object_id, goal | read |
| get_operation | 回读原操作 | operation_key | read |

默认流程、边界及验收见 [docs](docs/README.md)。
