import { describe, it, expect } from 'vitest';
import { parseFiltersString, parseFieldsString } from '../contacts.service';

describe('parseFiltersString', () => {
  it('returns empty object when raw is undefined', () => {
    expect(parseFiltersString(undefined)).toEqual({});
  });

  it('returns empty object when raw is empty string', () => {
    expect(parseFiltersString('')).toEqual({});
  });

  it('parses boolean filter to true', () => {
    const result = parseFiltersString('is_prospect:true');
    expect(result.is_prospect).toBe(true);
  });

  it('parses boolean filter to false', () => {
    const result = parseFiltersString('is_customer:false');
    expect(result.is_customer).toBe(false);
  });

  it('parses multiple filters', () => {
    const result = parseFiltersString('is_prospect:true,is_customer:false,is_supplier:true');
    expect(result.is_prospect).toBe(true);
    expect(result.is_customer).toBe(false);
    expect(result.is_supplier).toBe(true);
  });

  it('maps is_seller to is_seller_flag', () => {
    const result = parseFiltersString('is_seller:true');
    expect(result.is_seller_flag).toBe(true);
  });

  it('parses id_city as integer', () => {
    const result = parseFiltersString('id_city:42');
    expect(result.id_city).toBe(42);
  });

  it('ignores id_city when value is not a number', () => {
    const result = parseFiltersString('id_city:abc');
    expect(result.id_city).toBeUndefined();
  });

  it('parses search as string', () => {
    const result = parseFiltersString('search:acme corp');
    expect(result.search).toBe('acme corp');
  });

  it('parses id_seller as string', () => {
    const result = parseFiltersString('id_seller:550e8400-e29b-41d4-a716-446655440000');
    expect(result.id_seller).toBe('550e8400-e29b-41d4-a716-446655440000');
  });

  it('parses iso_code as string', () => {
    const result = parseFiltersString('iso_code:CO');
    expect(result.iso_code).toBe('CO');
  });

  it('ignores unknown keys silently', () => {
    const result = parseFiltersString('unknown_key:value');
    expect(result).toEqual({});
  });

  it('ignores pairs without a colon', () => {
    const result = parseFiltersString('is_prospect:true,malformed');
    expect(result.is_prospect).toBe(true);
  });
});

describe('parseFieldsString', () => {
  it('returns empty array when raw is undefined', () => {
    expect(parseFieldsString(undefined)).toEqual([]);
  });

  it('returns empty array when raw is empty string', () => {
    expect(parseFieldsString('')).toEqual([]);
  });

  it('returns valid field names', () => {
    expect(parseFieldsString('id_contact,email,phone_mobile')).toEqual([
      'id_contact',
      'email',
      'phone_mobile',
    ]);
  });

  it('filters out unknown field names', () => {
    expect(parseFieldsString('id_contact,unknown_col,email')).toEqual([
      'id_contact',
      'email',
    ]);
  });

  it('trims whitespace around field names', () => {
    expect(parseFieldsString(' id_contact , email ')).toEqual([
      'id_contact',
      'email',
    ]);
  });

  it('allows JOIN-backed fields city_name and region_name', () => {
    expect(parseFieldsString('city_name,region_name')).toEqual([
      'city_name',
      'region_name',
    ]);
  });

  it('allows invoices-backed field last_invoice', () => {
    expect(parseFieldsString('id_contact,last_invoice')).toEqual([
      'id_contact',
      'last_invoice',
    ]);
  });

  it('keeps backward compatibility for last_invoices', () => {
    expect(parseFieldsString('id_contact,last_invoices')).toEqual([
      'id_contact',
      'last_invoices',
    ]);
  });
});
