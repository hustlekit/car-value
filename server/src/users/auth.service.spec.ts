import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';


describe( 'AuthService', () => {
  let service: AuthService;
  let fakeUsersService: Partial<UsersService>;
  
  beforeEach( async () => {
    fakeUsersService = {
      find: () => Promise.resolve( [] ),
      create: ( email: string, password: string ) => Promise.resolve( { id: 1, email, password } as User ),
    };
    
    const module = await Test.createTestingModule( {
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: fakeUsersService,
        },
      ],
    } ).compile();
    
    service = module.get( AuthService );
  } );
  
  it( 'can create an instance of auth service', async () => {
    expect( service ).toBeDefined();
  } );
  
  it( 'creates a new user with hashed password', async () => {
    const user = await service.signup( 'test@test.com', 'passtest' );
    
    expect( user.password ).not.toEqual( 'passtest' );
    const [ salt, hash ] = user.password.split( '.' );
    expect( salt ).toBeDefined();
    expect( hash ).toBeDefined();
  } );
  
  it( 'throws an error if user signs up with email that is in use', async () => {
    fakeUsersService.find = () => Promise.resolve( [ { id: 1, email: 'test@test.com', password: 'pass' } as User ] );
    await expect( service.signup( 'test@test.com', 'passtest' ) ).rejects.toThrow( BadRequestException );
  } );
  
  it( 'throws if signin is called with an unused email', async () => {
    await expect( service.signin( 'asdasdasd@dsadsa.com', 'pass' ) ).rejects.toThrow( NotFoundException );
  } );
  
  it( 'throws if an invalid password is provided', async () => {
    fakeUsersService.find = () => {
      return Promise.resolve( [
        { email: 'asdf@asdf.com', password: 'pass' } as User,
      ] );
    }
    await expect( service.signin('asdf@asdf.com', 'password'), ).rejects.toThrow(BadRequestException);
  } )
} );