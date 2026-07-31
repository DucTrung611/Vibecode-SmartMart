import { UsersService } from '../services/users.service';
import { UserRepository } from '../repositories/user.repository';
import { UserAddressRepository } from '../repositories/user-address.repository';

describe('UsersService', () => {
  let service: UsersService;
  let dataSource: { transaction: jest.Mock };
  let userRepository: jest.Mocked<Pick<UserRepository, 'findById' | 'save'>>;
  let userAddressRepository: jest.Mocked<
    Pick<
      UserAddressRepository,
      | 'findAllByUser'
      | 'findOne'
      | 'create'
      | 'save'
      | 'delete'
      | 'unsetDefaultForUser'
    >
  >;

  beforeEach(() => {
    dataSource = { transaction: jest.fn((cb: any) => cb({})) };
    userRepository = {
      findById: jest.fn(),
      save: jest.fn((u: any) => Promise.resolve(u)),
    };
    userAddressRepository = {
      findAllByUser: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((data: any) => data),
      save: jest.fn((a: any) => Promise.resolve(a)),
      delete: jest.fn(),
      unsetDefaultForUser: jest.fn(),
    };

    service = new UsersService(
      dataSource as any,
      userRepository as unknown as UserRepository,
      userAddressRepository as unknown as UserAddressRepository,
    );
  });

  describe('updateProfile', () => {
    it('throws IDENTITY_USER_NOT_FOUND when the user does not exist', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(
        service.updateProfile('missing-id', { preferences: { a: 1 } }),
      ).rejects.toMatchObject({ code: 'IDENTITY_USER_NOT_FOUND' });
    });

    it('updates preferences on the happy path', async () => {
      userRepository.findById.mockResolvedValue({
        id: 'u1',
        email: 'a@test.com',
        status: 'active',
        preferences: {},
        createdAt: new Date(),
      } as any);

      const result = await service.updateProfile('u1', {
        preferences: { theme: 'dark' },
      });

      expect(result.preferences).toEqual({ theme: 'dark' });
    });
  });

  describe('createAddress', () => {
    it('unsets the previous default before inserting a new default address', async () => {
      const calls: string[] = [];
      userAddressRepository.unsetDefaultForUser.mockImplementation(() => {
        calls.push('unset');
        return Promise.resolve();
      });
      userAddressRepository.save.mockImplementation((a: any) => {
        calls.push('save');
        return Promise.resolve(a);
      });

      await service.createAddress('u1', {
        recipientName: 'Alice',
        line1: '123 Main St',
        city: 'Hanoi',
        countryCode: 'VN',
        isDefaultShipping: true,
      });

      expect(calls).toEqual(['unset', 'save']);
    });

    it('does not touch existing defaults when the new address is not default', async () => {
      await service.createAddress('u1', {
        recipientName: 'Alice',
        line1: '123 Main St',
        city: 'Hanoi',
        countryCode: 'VN',
      });

      expect(userAddressRepository.unsetDefaultForUser).not.toHaveBeenCalled();
    });
  });

  describe('deleteAddress', () => {
    it('throws IDENTITY_ADDRESS_NOT_FOUND when the address does not belong to the user', async () => {
      userAddressRepository.findOne.mockResolvedValue(null);

      await expect(
        service.deleteAddress('u1', 'missing-address'),
      ).rejects.toMatchObject({ code: 'IDENTITY_ADDRESS_NOT_FOUND' });
    });
  });
});
