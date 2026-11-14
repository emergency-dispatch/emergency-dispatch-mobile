import { apiService } from '../api/client';
import { Endpoints } from '../api/endpoints';
import { BackendApiResponse } from '../types/auth';

export type EquipmentCategory =
  | 'FireFighting'
  | 'Medical'
  | 'Rescue'
  | 'Protective'
  | 'Communication'
  | 'Other';

export type EquipmentStatus = 'Available' | 'Maintenance';

export interface EquipmentDto {
  id: string;
  name: string;
  category: EquipmentCategory;
  status: EquipmentStatus;
  quantity: number;
  stationId: string;
  stationName: string | null;
  rescueUnitId: string | null;
  rescueUnitPlate: string | null;
  notes: string | null;
  statusNote: string | null;
  statusChangedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface UpdateEquipmentStatusDto {
  status: EquipmentStatus;
  note?: string | null;
}

/**
 * Service quản lý & báo hỏng thiết bị cứu nạn (Mục 25)
 * - Staff có quyền GET /api/equipment để xem danh mục trang thiết bị của trạm hoặc xe tổ mình.
 * - Staff có quyền báo hỏng tại chỗ: PUT /api/equipment/{id}/status với status = "Maintenance" kèm lý do ≥ 5 ký tự.
 */
export const equipmentService = {
  /**
   * GET /api/equipment
   * Nếu không truyền stationId, backend tự động lấy stationId của RescueStaff hiện tại.
   */
  async listEquipment(params?: {
    stationId?: string;
    rescueUnitId?: string;
    status?: EquipmentStatus;
    category?: EquipmentCategory;
  }): Promise<EquipmentDto[]> {
    const response = await apiService.get<BackendApiResponse<EquipmentDto[]>>(
      Endpoints.EQUIPMENT.BASE,
      params
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Không thể tải danh sách trang thiết bị.');
    }
    return response.data;
  },

  /**
   * Báo hỏng thiết bị tại chỗ (PUT /api/equipment/{id}/status)
   * Rule: Lý do (note) bắt buộc ≥ 5 ký tự khi chuyển sang "Maintenance".
   */
  async reportBreakdown(equipmentId: string, reason: string): Promise<EquipmentDto> {
    const trimmedReason = reason.trim();
    if (trimmedReason.length < 5) {
      throw new Error('Lý do báo hỏng / bảo trì phải có ít nhất 5 ký tự.');
    }

    const payload: UpdateEquipmentStatusDto = {
      status: 'Maintenance',
      note: trimmedReason,
    };

    const response = await apiService.put<BackendApiResponse<EquipmentDto>>(
      Endpoints.EQUIPMENT.STATUS(equipmentId),
      payload
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Báo hỏng thiết bị thất bại.');
    }
    return response.data;
  },

  /**
   * Khôi phục thiết bị về trạng thái Sẵn sàng tác chiến (PUT /api/equipment/{id}/status)
   */
  async restoreAvailable(equipmentId: string): Promise<EquipmentDto> {
    const payload: UpdateEquipmentStatusDto = {
      status: 'Available',
      note: null,
    };

    const response = await apiService.put<BackendApiResponse<EquipmentDto>>(
      Endpoints.EQUIPMENT.STATUS(equipmentId),
      payload
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Khôi phục trạng thái thiết bị thất bại.');
    }
    return response.data;
  },
};

